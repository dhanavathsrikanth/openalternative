import { describe, it, expect } from 'vitest'

// ── Comparison Page rendering logic tests ─────────────────────────────────

describe('Comparison page slug parsing', () => {
  function parseSlugs(raw: string): { slugA: string; slugB: string } | null {
    const match = raw.match(/^(.+)-vs-(.+)$/)
    if (!match) return null
    return { slugA: match[1], slugB: match[2] }
  }

  it('parses valid comparison slug', () => {
    const result = parseSlugs('next-vs-remix')
    expect(result).toEqual({ slugA: 'next', slugB: 'remix' })
  })

  it('parses multi-word slugs', () => {
    const result = parseSlugs('my-project-vs-other-project')
    expect(result).toEqual({ slugA: 'my-project', slugB: 'other-project' })
  })

  it('returns null for invalid format', () => {
    expect(parseSlugs('just-a-slug')).toBeNull()
    expect(parseSlugs('next-remix')).toBeNull()
    expect(parseSlugs('')).toBeNull()
  })

  it('handles -vs- appearing multiple times (greedy captures last)', () => {
    const result = parseSlugs('a-vs-b-vs-c')
    expect(result).toEqual({ slugA: 'a-vs-b', slugB: 'c' })
  })
})

describe('Comparison canonical ordering', () => {
  function canonicalSlug(a: string, b: string): string {
    return a < b ? `${a}-vs-${b}` : `${b}-vs-${a}`
  }

  it('sorts alphabetically', () => {
    expect(canonicalSlug('remix', 'next')).toBe('next-vs-remix')
    expect(canonicalSlug('next', 'remix')).toBe('next-vs-remix')
  })

  it('handles equal slugs', () => {
    expect(canonicalSlug('next', 'next')).toBe('next-vs-next')
  })

  it('handles single-char slugs', () => {
    expect(canonicalSlug('a', 'b')).toBe('a-vs-b')
    expect(canonicalSlug('b', 'a')).toBe('a-vs-b')
  })
})

describe('Feature matrix building', () => {
  interface FeatureRow {
    label: string
    a: string | number | null
    b: string | number | null
  }

  function scoreLabel(score: string | null): string {
    if (!score) return '—'
    const n = Math.round(parseFloat(score))
    if (n >= 80) return `${n} (High)`
    if (n >= 60) return `${n} (Good)`
    if (n >= 40) return `${n} (Moderate)`
    return `${n} (Low)`
  }

  function licenseCompare(a: string | null, b: string | null): string {
    if (a === b) return 'Same'
    if (!a) return 'B has license, A does not'
    if (!b) return 'A has license, B does not'
    return `${a} vs ${b}`
  }

  function buildFeatureMatrix(
    a: { license: string | null; primaryLanguage: string | null; confidenceScore: string | null; deploymentMethods: string[] | null },
    b: { license: string | null; primaryLanguage: string | null; confidenceScore: string | null; deploymentMethods: string[] | null },
  ): FeatureRow[] {
    return [
      { label: 'License', a: a.license, b: b.license },
      { label: 'Language', a: a.primaryLanguage, b: b.primaryLanguage },
      { label: 'Confidence Score', a: scoreLabel(a.confidenceScore), b: scoreLabel(b.confidenceScore) },
      { label: 'Deployment', a: a.deploymentMethods?.join(', ') ?? '—', b: b.deploymentMethods?.join(', ') ?? '—' },
      { label: 'License Comparison', a: licenseCompare(a.license, b.license), b: licenseCompare(b.license, a.license) },
    ]
  }

  it('builds matrix for two products with data', () => {
    const a = {
      license: 'MIT',
      primaryLanguage: 'TypeScript',
      confidenceScore: '85',
      deploymentMethods: ['docker', 'npm'],
    }
    const b = {
      license: 'Apache-2.0',
      primaryLanguage: 'Go',
      confidenceScore: '72',
      deploymentMethods: ['binary'],
    }

    const matrix = buildFeatureMatrix(a, b)
    expect(matrix).toHaveLength(5)
    expect(matrix[0]).toEqual({ label: 'License', a: 'MIT', b: 'Apache-2.0' })
    expect(matrix[1]).toEqual({ label: 'Language', a: 'TypeScript', b: 'Go' })
    expect(matrix[2]).toEqual({ label: 'Confidence Score', a: '85 (High)', b: '72 (Good)' })
    expect(matrix[3]).toEqual({ label: 'Deployment', a: 'docker, npm', b: 'binary' })
    expect(matrix[4]).toEqual({ label: 'License Comparison', a: 'MIT vs Apache-2.0', b: 'Apache-2.0 vs MIT' })
  })

  it('handles products with missing data', () => {
    const a = { license: null, primaryLanguage: null, confidenceScore: null, deploymentMethods: null }
    const b = { license: 'MIT', primaryLanguage: 'Rust', confidenceScore: '45', deploymentMethods: ['cargo'] }

    const matrix = buildFeatureMatrix(a, b)
    expect(matrix[0].a).toBeNull()
    expect(matrix[0].b).toBe('MIT')
    expect(matrix[1].a).toBeNull()
    expect(matrix[1].b).toBe('Rust')
    expect(matrix[2].a).toBe('—')
    expect(matrix[2].b).toBe('45 (Moderate)')
    expect(matrix[3].a).toBe('—')
    expect(matrix[3].b).toBe('cargo')
  })

  it('detects same license', () => {
    expect(licenseCompare('MIT', 'MIT')).toBe('Same')
  })

  it('detects different licenses', () => {
    expect(licenseCompare('MIT', 'GPL-3.0')).toBe('MIT vs GPL-3.0')
  })

  it('handles missing licenses', () => {
    expect(licenseCompare(null, 'MIT')).toBe('B has license, A does not')
    expect(licenseCompare('MIT', null)).toBe('A has license, B does not')
    expect(licenseCompare(null, null)).toBe('Same')
  })
})

describe('Comparison metadata', () => {
  it('generates correct title for comparison', () => {
    const nameA = 'Next.js'
    const nameB = 'Remix'
    const title = `${nameA} vs ${nameB} — Forklane`
    expect(title).toBe('Next.js vs Remix — Forklane')
  })

  it('generates correct description', () => {
    const nameA = 'Next.js'
    const nameB = 'Remix'
    const desc = `Compare ${nameA} and ${nameB}: features, license, and migration confidence.`
    expect(desc).toBe('Compare Next.js and Remix: features, license, and migration confidence.')
  })
})

describe('Comparison canonical redirect', () => {
  function canonicalSlug(a: string, b: string): string {
    return a < b ? `${a}-vs-${b}` : `${b}-vs-${a}`
  }

  it('redirects reversed slugs to canonical', () => {
    expect(canonicalSlug('remix', 'next')).toBe('next-vs-remix')
  })

  it('does not redirect when already canonical', () => {
    expect(canonicalSlug('next', 'remix')).toBe('next-vs-remix')
  })

  it('handles numeric slugs', () => {
    expect(canonicalSlug('vue2', 'vue3')).toBe('vue2-vs-vue3')
    expect(canonicalSlug('vue3', 'vue2')).toBe('vue2-vs-vue3')
  })
})

describe('Comparison listing page', () => {
  function buildCanonicalSlug(slugA: string, slugB: string): string {
    return slugA < slugB ? `${slugA}-vs-${slugB}` : `${slugB}-vs-${slugA}`
  }

  it('builds canonical link for listing', () => {
    const link = `/compare/${buildCanonicalSlug('next', 'remix')}`
    expect(link).toBe('/compare/next-vs-remix')
  })
})
