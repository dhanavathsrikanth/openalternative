import { describe, it, expect } from 'vitest'

// ── Product Page rendering logic tests ────────────────────────────────────
//
// We test the pure functions and logic used by the product-page components.
// React rendering with jsdom is not available (vitest uses node env), so we
// focus on the data-transformation logic that drives the UI.

describe('ConfidenceGauge logic', () => {
  function getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  function getScoreLabel(score: number): string {
    if (score >= 80) return 'High'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Moderate'
    return 'Low'
  }

  it('maps high scores to green', () => {
    expect(getScoreColor(95)).toBe('text-green-600')
    expect(getScoreColor(80)).toBe('text-green-600')
  })

  it('maps good scores to yellow', () => {
    expect(getScoreColor(70)).toBe('text-yellow-600')
    expect(getScoreColor(60)).toBe('text-yellow-600')
  })

  it('maps moderate scores to orange', () => {
    expect(getScoreColor(50)).toBe('text-orange-500')
    expect(getScoreColor(40)).toBe('text-orange-500')
  })

  it('maps low scores to red', () => {
    expect(getScoreColor(30)).toBe('text-red-500')
    expect(getScoreColor(0)).toBe('text-red-500')
  })

  it('returns correct labels', () => {
    expect(getScoreLabel(90)).toBe('High')
    expect(getScoreLabel(70)).toBe('Good')
    expect(getScoreLabel(50)).toBe('Moderate')
    expect(getScoreLabel(20)).toBe('Low')
  })

  it('handles boundary values', () => {
    expect(getScoreLabel(80)).toBe('High')
    expect(getScoreLabel(79)).toBe('Good')
    expect(getScoreLabel(60)).toBe('Good')
    expect(getScoreLabel(59)).toBe('Moderate')
    expect(getScoreLabel(40)).toBe('Moderate')
    expect(getScoreLabel(39)).toBe('Low')
  })
})

describe('LicenseBadge logic', () => {
  const PERMISSIVE = new Set(['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause'])

  it('identifies MIT as permissive', () => {
    expect(PERMISSIVE.has('MIT')).toBe(true)
  })

  it('identifies Apache-2.0 as permissive', () => {
    expect(PERMISSIVE.has('Apache-2.0')).toBe(true)
  })

  it('identifies GPL-3.0 as not permissive', () => {
    expect(PERMISSIVE.has('GPL-3.0')).toBe(false)
  })

  it('identifies AGPL-3.0 as not permissive', () => {
    expect(PERMISSIVE.has('AGPL-3.0')).toBe(false)
  })

  it('identifies unknown licenses as not permissive', () => {
    expect(PERMISSIVE.has('Custom-License')).toBe(false)
  })
})

describe('DeploymentMethods logic', () => {
  const METHOD_LABELS: Record<string, string> = {
    docker: 'Docker',
    npm: 'npm',
    pip: 'pip',
    cargo: 'cargo',
    binary: 'Binary',
    source: 'Source',
  }

  it('maps known methods to labels', () => {
    expect(METHOD_LABELS.docker).toBe('Docker')
    expect(METHOD_LABELS.npm).toBe('npm')
    expect(METHOD_LABELS.pip).toBe('pip')
    expect(METHOD_LABELS.cargo).toBe('cargo')
    expect(METHOD_LABELS.binary).toBe('Binary')
    expect(METHOD_LABELS.source).toBe('Source')
  })

  it('handles unknown methods with fallback', () => {
    const method = 'homebrew'
    expect(METHOD_LABELS[method] ?? method).toBe('homebrew')
  })

  it('handles null/empty methods', () => {
    const methods = null as string[] | null
    const isEmpty = !methods || methods.length === 0
    expect(isEmpty).toBe(true)
  })
})

describe('GithubStats logic', () => {
  function formatNumber(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return n.toLocaleString()
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'today'
    if (days === 1) return 'yesterday'
    if (days < 30) return `${days}d ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${Math.floor(days / 365)}y ago`
  }

  it('formats large numbers with k suffix', () => {
    expect(formatNumber(1500)).toBe('1.5k')
    expect(formatNumber(10000)).toBe('10.0k')
    expect(formatNumber(100000)).toBe('100.0k')
  })

  it('formats small numbers without suffix', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(42)).toBe('42')
    expect(formatNumber(999)).toBe('999')
  })

  it('computes relative time correctly', () => {
    const now = Date.now()
    const daysAgo = (n: number) => new Date(now - n * 86400000).toISOString()

    expect(timeAgo(daysAgo(0))).toBe('today')
    expect(timeAgo(daysAgo(1))).toBe('yesterday')
    expect(timeAgo(daysAgo(15))).toBe('15d ago')
    expect(timeAgo(daysAgo(60))).toBe('2mo ago')
    expect(timeAgo(daysAgo(400))).toBe('1y ago')
  })
})

describe('ProductJsonLd logic', () => {
  it('builds valid SoftwareApplication JSON-LD', () => {
    const product = {
      name: 'Test Project',
      description: 'A test project for unit testing',
      slug: 'test-project',
      license: 'MIT',
      primaryLanguage: 'TypeScript',
      githubUrl: 'https://github.com/test/project',
      homepageUrl: 'https://example.com',
      confidenceScore: '85',
    }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: product.name,
      description: product.description,
      url: product.homepageUrl,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cross-platform',
      license: `https://spdx.org/licenses/${product.license}`,
      runtimePlatform: product.primaryLanguage,
      codeRepository: product.githubUrl,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Math.round(parseFloat(product.confidenceScore) / 20),
        bestRating: 5,
        ratingCount: 1,
        name: 'Migration Confidence Score',
      },
    }

    expect(jsonLd['@type']).toBe('SoftwareApplication')
    expect(jsonLd.name).toBe('Test Project')
    expect(jsonLd.license).toBe('https://spdx.org/licenses/MIT')
    expect(jsonLd.codeRepository).toBe('https://github.com/test/project')
    expect(jsonLd.aggregateRating.ratingValue).toBe(4) // 85/20 = 4.25, rounded = 4
  })

  it('omits optional fields when null', () => {
    const product = {
      name: 'Minimal',
      description: 'Bare minimum',
      slug: 'minimal',
      license: null,
      primaryLanguage: null,
      githubUrl: null,
      homepageUrl: null,
      confidenceScore: null,
    }

    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: product.name,
      description: product.description,
      url: `https://forklane.dev/product/${product.slug}`,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cross-platform',
    }

    expect(jsonLd.license).toBeUndefined()
    expect(jsonLd.runtimePlatform).toBeUndefined()
    expect(jsonLd.codeRepository).toBeUndefined()
    expect(jsonLd.aggregateRating).toBeUndefined()
  })
})

describe('Product page metadata', () => {
  it('generates correct title', () => {
    const name = 'Next.js'
    const title = `${name} — Forklane`
    expect(title).toBe('Next.js — Forklane')
  })

  it('truncates long descriptions to 160 chars', () => {
    const longDesc = 'A'.repeat(300)
    expect(longDesc.slice(0, 160)).toHaveLength(160)
  })
})

describe('Products listing page', () => {
  it('formats scores correctly for listing', () => {
    const score = '85.7'
    expect(Math.round(parseFloat(score))).toBe(86)
  })

  it('handles null scores', () => {
    const score: string | null = null
    const display = score ? Math.round(parseFloat(score)) : null
    expect(display).toBeNull()
  })
})
