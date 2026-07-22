// ── Canonical Product Resolver ────────────────────────────────────────────
//
// De-duplicates forks, mirrors, and alternate registry entries into a single
// canonical `products` row.  Also flags archived / abandoned repos.
//
// Strategy:
// 1. For GitHub repos, check the `fork` flag and `parent` relationship.
// 2. If a repo is a fork, we prefer the parent (higher stars / older).
// 3. If two signals point to the same canonical project (e.g. GitHub + npm
//    for "next"), merge into one product row.
// 4. Flag repos that are archived or have had no activity in 180+ days.

export interface RawProductInput {
  source: string
  identifier: string
  payload: Record<string, unknown>
}

export interface CanonicalProduct {
  name: string
  slug: string
  description: string
  license: string | null
  primaryLanguage: string | null
  githubUrl: string | null
  homepageUrl: string | null
  deploymentMethods: string[]
  isArchived: boolean
  isAbandoned: boolean
  isFork: boolean
  canonicalIdentifier: string
}

const ABANDONMENT_THRESHOLD_DAYS = 180

/**
 * Derive a URL-safe slug from a project name.
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Determine if a repo is archived or abandoned based on signals.
 */
export function isArchived(payload: Record<string, unknown>): boolean {
  // GitHub sets `archived` boolean directly
  if (payload.archived === true) return true

  // crates.io uses `updated_at`; if stale for >180 days, flag it
  const updatedAt = (payload.updatedAt as string) || (payload.pushedAt as string)
  if (updatedAt) {
    const daysSinceUpdate = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceUpdate > ABANDONMENT_THRESHOLD_DAYS) return true
  }

  return false
}

/**
 * Determine if a repo has been abandoned (no push in 180+ days).
 */
export function isAbandoned(payload: Record<string, unknown>): boolean {
  const pushedAt = payload.pushedAt as string | undefined
  if (!pushedAt) return false

  const daysSincePush = (Date.now() - new Date(pushedAt).getTime()) / (1000 * 60 * 60 * 24)
  return daysSincePush > ABANDONMENT_THRESHOLD_DAYS
}

/**
 * Check if a payload indicates this is a fork.
 */
export function isFork(payload: Record<string, unknown>): boolean {
  return payload.fork === true
}

/**
 * Build a deployment methods list from signals.
 */
export function detectDeploymentMethods(payload: Record<string, unknown>): string[] {
  const methods: string[] = []
  const description = ((payload.description as string) || '').toLowerCase()
  const all = `${description} ${(payload.keywords as string[] || []).join(' ')} ${(payload.categories as string[] || []).join(' ')}`

  if (all.includes('docker') || all.includes('container')) methods.push('docker')
  if (all.includes('npm') || all.includes('node')) methods.push('npm')
  if (all.includes('pypi') || all.includes('pip') || all.includes('python')) methods.push('pip')
  if (all.includes('cargo') || all.includes('rust') || all.includes('crate')) methods.push('cargo')
  if (all.includes('binary') || all.includes('cli')) methods.push('binary')
  if (all.includes('source') || all.includes('build')) methods.push('source')

  return [...new Set(methods)]
}

/**
 * Determine the primary language from signals.
 */
export function detectPrimaryLanguage(payload: Record<string, unknown>): string | null {
  return (payload.language as string) || null
}

/**
 * Determine the license string, normalizing common variants.
 */
export function normalizeLicense(payload: Record<string, unknown>): string | null {
  const license = (payload.license as string) || null
  if (!license || license === 'NOASSERTION') return null
  return license
}

/**
 * Extract the GitHub URL from a payload.
 */
export function extractGithubUrl(payload: Record<string, unknown>): string | null {
  if (payload.githubUrl) return payload.githubUrl as string
  if (payload.fullName) return `https://github.com/${payload.fullName}`
  if (payload.repository) {
    const repo = payload.repository as string
    if (repo.includes('github.com')) {
      return repo.replace(/\.git$/, '').replace('git+', '')
    }
  }
  return null
}

/**
 * Extract the homepage URL from a payload.
 */
export function extractHomepageUrl(payload: Record<string, unknown>): string | null {
  return (payload.homepage as string) || (payload.homepageUrl as string) || null
}

/**
 * Resolve a single raw signal into a canonical product.
 * Does NOT write to the database — pure function.
 */
export function resolveCanonical(input: RawProductInput): CanonicalProduct {
  const { identifier, payload } = input

  // Determine the name
  const name = (payload.name as string) ||
    (payload.fullName as string) ||
    identifier.split('/').pop() ||
    identifier

  const slug = toSlug(name)

  return {
    name,
    slug,
    description: (payload.description as string) || (payload.summary as string) || '',
    license: normalizeLicense(payload),
    primaryLanguage: detectPrimaryLanguage(payload),
    githubUrl: extractGithubUrl(payload),
    homepageUrl: extractHomepageUrl(payload),
    deploymentMethods: detectDeploymentMethods(payload),
    isArchived: isArchived(payload),
    isAbandoned: isAbandoned(payload),
    isFork: isFork(payload),
    canonicalIdentifier: identifier,
  }
}

/**
 * Resolve a batch of raw signals into canonical products.
 * De-duplicates by slug: if multiple signals map to the same slug,
 * the one with the highest star count wins.
 */
export function resolveBatch(inputs: RawProductInput[]): CanonicalProduct[] {
  const bySlug = new Map<string, CanonicalProduct>()

  for (const input of inputs) {
    const canonical = resolveCanonical(input)
    const existing = bySlug.get(canonical.slug)

    if (!existing) {
      bySlug.set(canonical.slug, canonical)
    } else {
      // Keep the one with more stars (higher confidence)
      const existingStars = (existing as unknown as Record<string, unknown>).stars as number || 0
      const incomingStars = (input.payload.stars as number) || 0
      if (incomingStars > existingStars) {
        bySlug.set(canonical.slug, canonical)
      }
    }
  }

  return Array.from(bySlug.values())
}
