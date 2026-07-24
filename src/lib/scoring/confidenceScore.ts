// ── Confidence Score ──────────────────────────────────────────────────────
//
// Computes a 0–100 Migration Confidence Score from raw GitHub / registry
// signals.  The score is the weighted sum of five sub-scores, each 0–100.
//
// Sub-scores and weights:
//   activityTrend          30  – recent commit / release cadence
//   licenseCompatibility   25  – permissive → high, copyleft → low, unknown → 0
//   selfHostingComplexity  15  – simple = high, requires infra = low
//   dataExportCapability   15  – import / export format support
//   communityHealth        15  – contributors, issue response, PR activity
//
// A breakdown object is returned alongside the aggregate score so downstream
// consumers (UI, analytics) can explain the number.

export interface ScoreBreakdown {
  activityTrend: number
  licenseCompatibility: number
  selfHostingComplexity: number
  dataExportCapability: number
  communityHealth: number
}

export interface ScoreResult {
  score: number
  breakdown: ScoreBreakdown
}

// ── Weights ──────────────────────────────────────────────────────────────

const WEIGHTS: Record<keyof ScoreBreakdown, number> = {
  activityTrend: 30,
  licenseCompatibility: 25,
  selfHostingComplexity: 15,
  dataExportCapability: 15,
  communityHealth: 15,
}

// ── License mapping ──────────────────────────────────────────────────────

const PERMISSIVE_LICENSES = new Set([
  'MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'Unlicense',
  'CC0-1.0', '0BSD', 'Zlib', 'BSL-1.0',
])

const WEAK_COPYLEFT = new Set([
  'LGPL-2.1', 'LGPL-3.0', 'MPL-2.0', 'EPL-1.0', 'EPL-2.0',
])

const STRONG_COPYLEFT = new Set([
  'GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'SSPL-1.0',
])

// ── Self-hosting complexity keywords ─────────────────────────────────────

const SIMPLE_INDICATORS = ['docker', 'docker-compose', 'sqlite', 'flat-file', 'static', 'binary', 'single-binary']
const COMPLEX_INDICATORS = ['kubernetes', 'k8s', 'terraform', 'terraform', 'mesos', 'consul', 'vault', 'helm']

// ── Data export keywords ─────────────────────────────────────────────────

const EXPORT_KEYWORDS = ['export', 'import', 'migrate', 'migration', 'backup', 'json', 'csv', 'yaml', 'toml', 'api']

// ── Sub-score functions ──────────────────────────────────────────────────

export function scoreActivityTrend(payload: Record<string, unknown>): number {
  const stars = (payload.stars as number) || 0
  const forks = (payload.forks as number) || 0
  const watchers = (payload.watchers as number) || 0
  const recentDownloads = (payload.recentDownloads as number) || 0
  const openIssues = (payload.openIssues as number) || 0
  const latestRelease = payload.latestRelease as { publishedAt?: string } | null
  const pushedAt = payload.pushedAt as string | undefined
  const versionCount = (payload.versionCount as number) || 0

  let score = 0

  // Stars indicate adoption (0-25 pts)
  if (stars > 50000) score += 25
  else if (stars > 10000) score += 22
  else if (stars > 5000) score += 18
  else if (stars > 1000) score += 14
  else if (stars > 100) score += 9
  else if (stars > 10) score += 4

  // Forks indicate usage (0-12 pts)
  if (forks > 5000) score += 12
  else if (forks > 1000) score += 10
  else if (forks > 200) score += 7
  else if (forks > 50) score += 3

  // Watchers indicate active interest (0-8 pts)
  if (watchers > 1000) score += 8
  else if (watchers > 200) score += 6
  else if (watchers > 50) score += 4
  else if (watchers > 10) score += 2

  // Recent release (0-20 pts)
  if (latestRelease?.publishedAt) {
    const daysSinceRelease = (Date.now() - new Date(latestRelease.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceRelease < 30) score += 20
    else if (daysSinceRelease < 90) score += 15
    else if (daysSinceRelease < 180) score += 10
    else if (daysSinceRelease < 365) score += 5
  }

  // Recent push (0-15 pts)
  if (pushedAt) {
    const daysSincePush = (Date.now() - new Date(pushedAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSincePush < 7) score += 15
    else if (daysSincePush < 30) score += 12
    else if (daysSincePush < 90) score += 8
    else if (daysSincePush < 180) score += 4
  }

  // Version iteration (0-10 pts)
  if (versionCount > 50) score += 10
  else if (versionCount > 20) score += 8
  else if (versionCount > 10) score += 5
  else if (versionCount > 3) score += 3

  // npm downloads as proxy (0-10 pts)
  if (recentDownloads > 1000000) score += 10
  else if (recentDownloads > 100000) score += 8
  else if (recentDownloads > 10000) score += 5
  else if (recentDownloads > 1000) score += 3

  return Math.min(100, score)
}

export function scoreLicenseCompatibility(payload: Record<string, unknown>): number {
  const license = (payload.license as string) || null

  if (!license || license === 'NOASSERTION' || license === 'SEE LICENSE IN LICENSE') return 0

  if (PERMISSIVE_LICENSES.has(license)) return 100
  if (WEAK_COPYLEFT.has(license)) return 60
  if (STRONG_COPYLEFT.has(license)) return 25

  // Partial credit for unknown but present licenses
  if (license.length > 0) return 40

  return 0
}

export function scoreSelfHostingComplexity(payload: Record<string, unknown>): number {
  const description = ((payload.description as string) || '').toLowerCase()
  const repo = ((payload.repository as string) || '').toLowerCase()
  const homepage = ((payload.homepage as string) || '').toLowerCase()
  const repoSize = (payload.size as number) || 0
  const all = `${description} ${repo} ${homepage}`

  let score = 70 // baseline — most OSS tools are reasonably self-hostable

  const simpleHits = SIMPLE_INDICATORS.filter((k) => all.includes(k)).length
  const complexHits = COMPLEX_INDICATORS.filter((k) => all.includes(k)).length

  score += simpleHits * 10
  score -= complexHits * 15

  // Docker support is a strong positive signal
  if (all.includes('docker')) score += 10

  // Database requirement lowers score
  if (all.includes('postgres') || all.includes('mysql') || all.includes('mongodb')) {
    score -= 10
  }

  // Repo size penalty — very large repos are harder to self-host
  // size is in KB from GitHub (disk_usage)
  if (repoSize > 500_000) score -= 15      // >500MB
  else if (repoSize > 100_000) score -= 10  // >100MB
  else if (repoSize > 50_000) score -= 5    // >50MB

  return Math.max(0, Math.min(100, score))
}

export function scoreDataExportCapability(payload: Record<string, unknown>): number {
  const description = ((payload.description as string) || '').toLowerCase()
  const keywords = ((payload.keywords as string[]) || []).map((k) => k.toLowerCase())
  const categories = ((payload.categories as string[]) || []).map((c) => c.toLowerCase())
  const topics = ((payload.topics as string[]) || []).map((t) => t.toLowerCase())
  const all = `${description} ${keywords.join(' ')} ${categories.join(' ')} ${topics.join(' ')}`

  let score = 50 // baseline

  const exportHits = EXPORT_KEYWORDS.filter((k) => all.includes(k)).length
  score += exportHits * 8

  // API availability is a strong signal
  if (all.includes('rest') || all.includes('graphql') || all.includes('api')) {
    score += 15
  }

  // CLI tools tend to have better export
  if (all.includes('cli') || all.includes('command')) {
    score += 5
  }

  return Math.max(0, Math.min(100, score))
}

export function scoreCommunityHealth(payload: Record<string, unknown>): number {
  const stars = (payload.stars as number) || 0
  const forks = (payload.forks as number) || 0
  const openIssues = (payload.openIssues as number) || 0
  const description = ((payload.description as string) || '').length

  let score = 0

  // Star-to-fork ratio indicates community engagement (0-25 pts)
  if (forks > 0) {
    const ratio = stars / forks
    if (ratio > 2 && ratio < 20) score += 25
    else if (ratio >= 1 && ratio < 30) score += 18
    else score += 10
  } else if (stars > 0) {
    score += 15
  }

  // Issue management — not too many open (0-25 pts)
  if (openIssues === 0) score += 20
  else if (openIssues < 50) score += 25
  else if (openIssues < 200) score += 18
  else if (openIssues < 500) score += 10
  else score += 5

  // Has description (0-15 pts)
  if (description > 20) score += 15
  else if (description > 5) score += 8

  // Has homepage (0-15 pts)
  if (payload.homepage) score += 15
  else if (payload.homepageUrl) score += 15

  // Has repository URL (0-20 pts)
  if (payload.repository || payload.githubUrl) score += 20
  else score += 5

  return Math.min(100, score)
}

// ── Main scorer ──────────────────────────────────────────────────────────

export function computeConfidenceScore(payload: Record<string, unknown>): ScoreResult {
  const breakdown: ScoreBreakdown = {
    activityTrend: scoreActivityTrend(payload),
    licenseCompatibility: scoreLicenseCompatibility(payload),
    selfHostingComplexity: scoreSelfHostingComplexity(payload),
    dataExportCapability: scoreDataExportCapability(payload),
    communityHealth: scoreCommunityHealth(payload),
  }

  let weighted = 0
  for (const [key, weight] of Object.entries(WEIGHTS) as [keyof ScoreBreakdown, number][]) {
    weighted += (breakdown[key] / 100) * weight
  }

  const score = Math.round(weighted * 100) / 100 // 2 decimal places

  return { score, breakdown }
}
