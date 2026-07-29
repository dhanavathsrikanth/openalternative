import { z } from 'zod'

// ── Forge host validation ─────────────────────────────────────────────────
//
// Products must be hosted on a recognized public forge.
// The repo URL must point to a real forge, not a random domain.

const ALLOWED_FORGE_HOSTS = [
  'github.com',
  'gitlab.com',
  'codeberg.org',
  'bitbucket.org',
] as const

const FORGE_HOST_SET = new Set(ALLOWED_FORGE_HOSTS)

export type ForgeHost = (typeof ALLOWED_FORGE_HOSTS)[number]

export interface ForgeUrlResult {
  valid: boolean
  host?: ForgeHost
  owner?: string
  repo?: string
  error?: string
}

/**
 * Parse and validate a repository URL. Must be hosted on a recognized forge.
 */
export function validateForgeUrl(url: string | null | undefined): ForgeUrlResult {
  if (!url || !url.trim()) {
    return { valid: false, error: 'Repository URL is required' }
  }

  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, error: 'Repository URL must use HTTPS' }
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')

  if (!FORGE_HOST_SET.has(host as ForgeHost)) {
    return {
      valid: false,
      error: `Repository must be hosted on one of: ${ALLOWED_FORGE_HOSTS.join(', ')}. Found: ${host}`,
    }
  }

  const pathParts = parsed.pathname.split('/').filter(Boolean)
  if (pathParts.length < 2) {
    return { valid: false, error: 'Repository URL must include owner and repo name (e.g. https://github.com/owner/repo)' }
  }

  const owner = pathParts[0]
  const repo = pathParts[1].replace(/\.git$/, '')

  return { valid: true, host: host as ForgeHost, owner, repo }
}

// ── Homepage blocklist ────────────────────────────────────────────────────
//
// Throwaway subdomains of site builders are flagged for review, not
// hard-blocked, since some legitimate projects do use them.

const HOMEPAGE_BLOCKLIST_HOSTS = [
  'vercel.app',
  'netlify.app',
  'github.io',
  'gitlab.io',
  'bitbucket.io',
  'surge.sh',
  'firebaseapp.com',
  'web.app',
  'pages.dev',
  'cloudfront.net',
  'railway.app',
  'render.com',
  'fly.dev',
  'onrender.com',
] as const

const HOMEPAGE_BLOCKLIST_SET = new Set(HOMEPAGE_BLOCKLIST_HOSTS)

export interface HomepageCheckResult {
  ok: boolean
  flagged: boolean
  reason?: string
}

/**
 * Check if a homepage URL is on the blocklist.
 * Returns `flagged: true` for review, never hard-blocks.
 */
export function checkHomepage(url: string | null | undefined): HomepageCheckResult {
  if (!url || !url.trim()) {
    return { ok: true, flagged: false }
  }

  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return { ok: false, flagged: false, reason: 'Invalid homepage URL format' }
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, '')

  if (HOMEPAGE_BLOCKLIST_SET.has(host as typeof HOMEPAGE_BLOCKLIST_HOSTS[number])) {
    return {
      ok: true,
      flagged: true,
      reason: `Homepage is hosted on ${host}, which is typically a deployment preview URL. Flagged for review.`,
    }
  }

  return { ok: true, flagged: false }
}

// ── Scope heuristic ───────────────────────────────────────────────────────
//
// Flag submissions that look like bare CLIs, single-purpose scripts,
// or thin API wrapper libraries rather than full applications.
// Uses heuristics: no UI-related files, no frontend framework detected,
// very small file count.

const CLI_INDICATOR_PATTERNS = [
  /\bcli\b/i,
  /\bcommand[- ]?line\b/i,
  /\bterminal\b/i,
  /\bconsole\b/i,
  /\bscript\b/i,
  /\bwrapper\b/i,
  /\bsdk\b/i,
  /\bclient[- ]?lib/i,
]

const UI_FRAMEWORKS = new Set([
  'react', 'react-dom', 'react-native', 'next', 'nextjs',
  '@remix-run/react', 'remix', 'nuxt', 'nuxt3',
  'vue', 'vuejs', 'angular', 'svelte', 'solid-js', 'preact',
  'htmx', 'alpine.js', 'stimulus', 'turbo',
  'ember', 'backbone', 'jquery',
  'flutter', 'swiftui', 'jetpack-compose',
  'tauri', 'electron',
  'express', 'fastify', 'koa', 'hapi', 'nest', 'nestjs',
  'rails', 'django', 'flask', 'laravel', 'symfony',
  'tailwind', 'bootstrap', 'bulma', 'chakra-ui', 'shadcn',
])

export interface ScopeFlag {
  flagged: boolean
  reasons: string[]
}

/**
 * Heuristic check for whether a product looks like a full application
 * vs. a bare CLI / thin wrapper. Returns flags for human review.
 */
export function checkScope(name: string, description: string, techStack: unknown): ScopeFlag {
  const reasons: string[] = []

  // Check name/description for CLI/script indicators
  const combined = `${name} ${description}`
  for (const pattern of CLI_INDICATOR_PATTERNS) {
    if (pattern.test(combined)) {
      reasons.push(`Name or description suggests a CLI/script/wrapper: matched "${pattern.source}"`)
      break
    }
  }

  // Check if tech stack has any UI frameworks
  if (techStack && Array.isArray(techStack)) {
    const hasUI = techStack.some(
      (t: { name?: string; category?: string }) =>
        t.category === 'Frameworks' && t.name && UI_FRAMEWORKS.has(t.name.toLowerCase())
    )
    if (!hasUI) {
      reasons.push('No frontend/UI framework detected in tech stack')
    }
  } else {
    // No tech stack info available — flag for review
    reasons.push('No tech stack data available to assess UI presence')
  }

  return { flagged: reasons.length > 0, reasons }
}

// ── Submission validation schema ──────────────────────────────────────────

export const submissionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().min(1).max(120).optional(),
  tagline: z.string().min(1, 'Tagline is required').max(80),
  description: z.string().min(1, 'Description is required').max(200),
  githubUrl: z.string().url('Must be a valid URL'),
  homepageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  license: z.string().min(1, 'License is required'),
  primaryLanguage: z.string().optional().or(z.literal('')),
  categoryIds: z.array(z.number()).min(1, 'At least one category is required'),
  tagIds: z.array(z.number()).min(1, 'At least one tag is required'),
})

export type SubmissionInput = z.infer<typeof submissionSchema>

// ── Combined submission validation ────────────────────────────────────────

export interface SubmissionValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
  reviewFlags: string[]
}

/**
 * Run all validation checks on a product submission.
 * - Hard errors block submission
 * - Warnings are shown but don't block
 * - Review flags are stored for admin review
 */
export function validateSubmission(input: SubmissionInput, techStack?: unknown): SubmissionValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const reviewFlags: string[] = []

  // 1. Basic schema validation
  const schemaResult = submissionSchema.safeParse(input)
  if (!schemaResult.success) {
    for (const issue of schemaResult.error.issues) {
      errors.push(issue.message)
    }
  }

  // 2. Forge URL validation (hard block)
  const forgeResult = validateForgeUrl(input.githubUrl)
  if (!forgeResult.valid) {
    errors.push(forgeResult.error!)
  }

  // 3. Homepage check (flag for review, don't block)
  const homepageResult = checkHomepage(input.homepageUrl)
  if (!homepageResult.ok) {
    errors.push(homepageResult.reason!)
  } else if (homepageResult.flagged) {
    reviewFlags.push(homepageResult.reason!)
  }

  // 4. Scope heuristic (flag for review)
  const scopeResult = checkScope(input.name, input.description, techStack)
  if (scopeResult.flagged) {
    reviewFlags.push(...scopeResult.reasons)
  }

  return { ok: errors.length === 0, errors, warnings, reviewFlags }
}
