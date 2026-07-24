import { db } from '@/app/db'
import { Products, Comparisons, ProductCategories } from '@/app/db/schema'
import { and, eq, or } from 'drizzle-orm'
import type { ScoreBreakdown } from '@/lib/scoring/confidenceScore'
import type { DetectedTech } from '@/lib/content-gen/tech-detect'

const GITHUB_RAW = 'https://raw.githubusercontent.com'

// ── In-memory cache (per serverless instance) ──────────────────────────────

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function fromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function toCache<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ── GitHub helpers ────────────────────────────────────────────────────────

function githubHeaders(): HeadersInit {
  const h: HeadersInit = { Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return h
}

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) return null
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
}

// ── Raw file fetchers ─────────────────────────────────────────────────────

async function fetchRawFile(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string | null> {
  const cacheKey = `raw:${owner}/${repo}@${branch}:${path}`
  const cached = fromCache<string>(cacheKey)
  if (cached !== null) return cached

  try {
    const res = await fetch(`${GITHUB_RAW}/${owner}/${repo}/${branch}/${path}`, {
      headers: githubHeaders(),
    })
    if (!res.ok) return null
    const text = await res.text()
    toCache(cacheKey, text)
    return text
  } catch {
    return null
  }
}

// ── Public API ────────────────────────────────────────────────────────────

export interface ProductContext {
  productId: number
  name: string
  slug: string
  description: string
  tagline: string | null
  license: string | null
  primaryLanguage: string | null
  githubUrl: string | null
  homepageUrl: string | null
  stars: number | null
  forks: number | null
  topics: string[]
  scoreBreakdown: ScoreBreakdown | null
  techStackDetected: DetectedTech[] | null
  readme: string | null
  packageManifest: string | null
  dockerfile: string | null
  dockerCompose: string | null
}

/**
 * Assemble the grounding context for a product. This is the single source of
 * truth every content-generation prompt reads from — no generation prompt
 * fetches its own data separately.
 */
export async function buildProductContext(productId: number): Promise<ProductContext> {
  const rows = await db
    .select()
    .from(Products)
    .where(eq(Products.id, productId))
    .limit(1)

  if (rows.length === 0) {
    throw new Error(`Product ${productId} not found`)
  }

  const product = rows[0]
  const parsed = product.githubUrl ? parseGithubUrl(product.githubUrl) : null

  let readme: string | null = null
  let packageManifest: string | null = null
  let dockerfile: string | null = null
  let dockerCompose: string | null = null

  if (parsed) {
    const { owner, repo } = parsed

    // Use stored defaultBranch from DB — no extra API call needed
    const branch = product.defaultBranch ?? 'main'

    // Fetch README (try common filenames)
    for (const name of ['README.md', 'readme.md', 'README.rst', 'README']) {
      const content = await fetchRawFile(owner, repo, branch, name)
      if (content) {
        readme = content
        break
      }
    }

    // Fetch package manifest (language-aware)
    const lang = product.primaryLanguage?.toLowerCase()
    const manifestCandidates = getManifestCandidates(lang)
    for (const path of manifestCandidates) {
      const content = await fetchRawFile(owner, repo, branch, path)
      if (content) {
        packageManifest = content
        break
      }
    }

    // Fetch Dockerfile
    for (const name of ['Dockerfile', 'docker/Dockerfile', 'Dockerfile.dev']) {
      const content = await fetchRawFile(owner, repo, branch, name)
      if (content) {
        dockerfile = content
        break
      }
    }

    // Fetch docker-compose.yml
    for (const name of ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml']) {
      const content = await fetchRawFile(owner, repo, branch, name)
      if (content) {
        dockerCompose = content
        break
      }
    }
  }

  return {
    productId: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    tagline: product.tagline,
    license: product.license,
    primaryLanguage: product.primaryLanguage,
    githubUrl: product.githubUrl,
    homepageUrl: product.homepageUrl,
    stars: product.stars,
    forks: product.forks,
    topics: product.topics ?? [],
    scoreBreakdown: (product.scoreBreakdown as ScoreBreakdown) ?? null,
    techStackDetected: (product.techStackDetected as DetectedTech[]) ?? null,
    readme,
    packageManifest,
    dockerfile,
    dockerCompose,
  }
}

function getManifestCandidates(lang: string | null | undefined): string[] {
  switch (lang) {
    case 'typescript':
    case 'javascript':
      return ['package.json']
    case 'python':
      return ['requirements.txt', 'pyproject.toml', 'setup.py', 'setup.cfg', 'Pipfile']
    case 'go':
      return ['go.mod']
    case 'rust':
      return ['Cargo.toml']
    case 'ruby':
      return ['Gemfile']
    case 'php':
      return ['composer.json']
    case 'java':
    case 'kotlin':
      return ['pom.xml', 'build.gradle', 'build.gradle.kts']
    case 'c#':
    case 'csharp':
      return ['*.csproj', '*.sln']
    default:
      return ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml']
  }
}

/**
 * Format the context into a human-readable string suitable for inclusion in
 * a prompt's user message.
 */
export function formatContextForPrompt(ctx: ProductContext): string {
  const sections: string[] = []

  sections.push(`# Product: ${ctx.name}`)
  sections.push(`Slug: ${ctx.slug}`)
  if (ctx.tagline) sections.push(`Tagline: ${ctx.tagline}`)
  sections.push(`Description: ${ctx.description}`)
  if (ctx.license) sections.push(`License: ${ctx.license}`)
  if (ctx.primaryLanguage) sections.push(`Primary language: ${ctx.primaryLanguage}`)
  if (ctx.githubUrl) sections.push(`GitHub: ${ctx.githubUrl}`)
  if (ctx.homepageUrl) sections.push(`Homepage: ${ctx.homepageUrl}`)
  if (ctx.stars !== null) sections.push(`Stars: ${ctx.stars}`)
  if (ctx.forks !== null) sections.push(`Forks: ${ctx.forks}`)
  if (ctx.topics.length > 0) sections.push(`Topics: ${ctx.topics.join(', ')}`)

  if (ctx.scoreBreakdown) {
    const sb = ctx.scoreBreakdown
    sections.push('')
    sections.push('## Confidence Score Breakdown')
    sections.push(`- Activity Trend: ${sb.activityTrend}/100`)
    sections.push(`- License Compatibility: ${sb.licenseCompatibility}/100`)
    sections.push(`- Self-Hosting Complexity: ${sb.selfHostingComplexity}/100`)
    sections.push(`- Data Export Capability: ${sb.dataExportCapability}/100`)
    sections.push(`- Community Health: ${sb.communityHealth}/100`)
  }

  if (ctx.techStackDetected && ctx.techStackDetected.length > 0) {
    sections.push('')
    sections.push('## Detected Tech Stack')
    const byCat = new Map<string, string[]>()
    for (const t of ctx.techStackDetected) {
      if (!byCat.has(t.category)) byCat.set(t.category, [])
      byCat.get(t.category)!.push(t.name)
    }
    for (const [cat, names] of byCat) {
      sections.push(`- ${cat}: ${names.join(', ')}`)
    }
  }

  if (ctx.readme) {
    sections.push('')
    sections.push('## README')
    // Truncate very long READMEs to keep within token limits
    sections.push(ctx.readme.slice(0, 12_000))
  }

  if (ctx.packageManifest) {
    sections.push('')
    sections.push('## Package Manifest')
    sections.push(ctx.packageManifest.slice(0, 4_000))
  }

  if (ctx.dockerfile) {
    sections.push('')
    sections.push('## Dockerfile')
    sections.push(ctx.dockerfile.slice(0, 4_000))
  }

  if (ctx.dockerCompose) {
    sections.push('')
    sections.push('## Docker Compose')
    sections.push(ctx.dockerCompose.slice(0, 4_000))
  }

  return sections.join('\n')
}

// ── Comparison targets ────────────────────────────────────────────────────

export interface ComparisonTarget {
  productId: number
  name: string
  slug: string
  description: string
  license: string | null
  primaryLanguage: string | null
  stars: number | null
  forks: number | null
  scoreBreakdown: ScoreBreakdown | null
}

/**
 * Find up to `limit` comparison targets for a product. Prefers products that
 * already have a pre-computed entry in the `comparisons` table (same category,
 * pairwise). Falls back to same-category products without an existing
 * comparison if fewer than `limit` targets are found.
 */
export async function findComparisonTargets(
  productId: number,
  limit = 3,
): Promise<ComparisonTarget[]> {
  // 1. Find categories this product belongs to
  const cats = await db
    .select({ categoryId: ProductCategories.categoryId })
    .from(ProductCategories)
    .where(eq(ProductCategories.productId, productId))

  if (cats.length === 0) return []

  const categoryIds = cats.map((c) => c.categoryId)

  // 2. Find products already linked via comparisons table (preferred)
  const compRows = await db
    .select({
      productAId: Comparisons.productAId,
      productBId: Comparisons.productBId,
    })
    .from(Comparisons)
    .where(
      or(
        eq(Comparisons.productAId, productId),
        eq(Comparisons.productBId, productId),
      ),
    )

  // Resolve the "other" product ID from each comparison row
  const linkedIds = new Set<number>()
  for (const row of compRows) {
    const otherId = row.productAId === productId ? row.productBId : row.productAId
    linkedIds.add(otherId)
  }

  const targetIds: number[] = [...linkedIds].slice(0, limit)

  // 3. If fewer than `limit`, fill from same-category products not yet linked
  if (targetIds.length < limit) {
    const categoryCondition = categoryIds.length === 1
      ? eq(ProductCategories.categoryId, categoryIds[0])
      : or(...categoryIds.map((cid) => eq(ProductCategories.categoryId, cid)))

    const sameCategory = await db
      .select({ id: Products.id })
      .from(Products)
      .innerJoin(ProductCategories, eq(ProductCategories.productId, Products.id))
      .where(
        and(
          eq(Products.status, 'published'),
          categoryCondition,
        ),
      )

    const existing = new Set([productId, ...targetIds])
    for (const row of sameCategory) {
      if (targetIds.length >= limit) break
      if (!existing.has(row.id)) {
        targetIds.push(row.id)
        existing.add(row.id)
      }
    }
  }

  if (targetIds.length === 0) return []

  // 4. Fetch product details for all targets
  const idCondition = targetIds.length === 1
    ? eq(Products.id, targetIds[0])
    : or(...targetIds.map((id) => eq(Products.id, id)))

  const targets = await db
    .select()
    .from(Products)
    .where(idCondition)

  return targets.map((p) => ({
    productId: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    license: p.license,
    primaryLanguage: p.primaryLanguage,
    stars: p.stars,
    forks: p.forks,
    scoreBreakdown: (p.scoreBreakdown as ScoreBreakdown) ?? null,
  }))
}

/**
 * Format comparison targets into a prompt-friendly string. Each target
 * includes the key differentiating fields (license, language, scores) but
 * omits README/manifest to keep token count manageable — the model should
 * compare on structural facts, not prose.
 */
export function formatComparisonTargetsForPrompt(
  targets: ComparisonTarget[],
): string {
  if (targets.length === 0) return ''

  const lines: string[] = ['## Comparison Targets (potential alternatives)']
  lines.push('')

  for (const t of targets) {
    lines.push(`### ${t.name} (slug: ${t.slug}, productId: ${t.productId})`)
    lines.push(`Description: ${t.description}`)
    if (t.license) lines.push(`License: ${t.license}`)
    if (t.primaryLanguage) lines.push(`Primary language: ${t.primaryLanguage}`)
    if (t.stars !== null) lines.push(`Stars: ${t.stars}`)
    if (t.forks !== null) lines.push(`Forks: ${t.forks}`)

    if (t.scoreBreakdown) {
      const sb = t.scoreBreakdown
      lines.push('Confidence Score Breakdown:')
      lines.push(`  - Activity Trend: ${sb.activityTrend}/100`)
      lines.push(`  - License Compatibility: ${sb.licenseCompatibility}/100`)
      lines.push(`  - Self-Hosting Complexity: ${sb.selfHostingComplexity}/100`)
      lines.push(`  - Data Export Capability: ${sb.dataExportCapability}/100`)
      lines.push(`  - Community Health: ${sb.communityHealth}/100`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
