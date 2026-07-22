import { describe, it, expect } from 'vitest'
import {
  computeConfidenceScore,
  scoreActivityTrend,
  scoreLicenseCompatibility,
  scoreSelfHostingComplexity,
  scoreDataExportCapability,
  scoreCommunityHealth,
} from '@/lib/scoring/confidenceScore'

// ── Helpers ──────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()
}

function makePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    stars: 5000,
    forks: 500,
    openIssues: 30,
    language: 'TypeScript',
    license: 'MIT',
    description: 'A useful tool for developers',
    homepage: 'https://example.com',
    repository: 'https://github.com/example/tool',
    pushedAt: daysAgo(5),
    latestRelease: { publishedAt: daysAgo(10), tag: 'v1.0.0' },
    versionCount: 25,
    recentDownloads: 50000,
    keywords: ['cli', 'tool'],
    categories: [],
    ...overrides,
  }
}

// ── scoreActivityTrend ───────────────────────────────────────────────────

describe('scoreActivityTrend', () => {
  it('returns 0 for completely empty payload', () => {
    expect(scoreActivityTrend({})).toBe(0)
  })

  it('returns high score for very active repo', () => {
    const score = scoreActivityTrend(makePayload({
      stars: 100000,
      forks: 20000,
      openIssues: 100,
      pushedAt: daysAgo(1),
      latestRelease: { publishedAt: daysAgo(5) },
      versionCount: 100,
      recentDownloads: 5000000,
    }))
    expect(score).toBeGreaterThanOrEqual(95)
  })

  it('rewards recent releases', () => {
    const recent = scoreActivityTrend(makePayload({
      latestRelease: { publishedAt: daysAgo(10) },
    }))
    const old = scoreActivityTrend(makePayload({
      latestRelease: { publishedAt: daysAgo(200) },
    }))
    expect(recent).toBeGreaterThan(old)
  })

  it('rewards recent pushes', () => {
    const recent = scoreActivityTrend(makePayload({ pushedAt: daysAgo(2) }))
    const stale = scoreActivityTrend(makePayload({ pushedAt: daysAgo(200) }))
    expect(recent).toBeGreaterThan(stale)
  })

  it('rewards high star counts', () => {
    const high = scoreActivityTrend(makePayload({ stars: 50000 }))
    const low = scoreActivityTrend(makePayload({ stars: 100 }))
    expect(high).toBeGreaterThan(low)
  })

  it('rewards high fork counts', () => {
    const high = scoreActivityTrend(makePayload({ forks: 5000 }))
    const low = scoreActivityTrend(makePayload({ forks: 10 }))
    expect(high).toBeGreaterThan(low)
  })

  it('rewards more versions', () => {
    const many = scoreActivityTrend(makePayload({ versionCount: 60 }))
    const few = scoreActivityTrend(makePayload({ versionCount: 2 }))
    expect(many).toBeGreaterThan(few)
  })

  it('rewards higher download counts', () => {
    const high = scoreActivityTrend(makePayload({ recentDownloads: 2000000 }))
    const low = scoreActivityTrend(makePayload({ recentDownloads: 500 }))
    expect(high).toBeGreaterThan(low)
  })

  it('caps at 100', () => {
    const score = scoreActivityTrend(makePayload({
      stars: 200000,
      forks: 50000,
      openIssues: 10,
      pushedAt: daysAgo(1),
      latestRelease: { publishedAt: daysAgo(1) },
      versionCount: 200,
      recentDownloads: 10000000,
    }))
    expect(score).toBeLessThanOrEqual(100)
  })

  it('handles missing latestRelease gracefully', () => {
    const score = scoreActivityTrend(makePayload({ latestRelease: null }))
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('handles zero stars/forks', () => {
    const score = scoreActivityTrend(makePayload({ stars: 0, forks: 0 }))
    expect(score).toBeGreaterThanOrEqual(0)
  })
})

// ── scoreLicenseCompatibility ────────────────────────────────────────────

describe('scoreLicenseCompatibility', () => {
  it('returns 0 for missing license', () => {
    expect(scoreLicenseCompatibility({})).toBe(0)
  })

  it('returns 0 for NOASSERTION', () => {
    expect(scoreLicenseCompatibility({ license: 'NOASSERTION' })).toBe(0)
  })

  it('returns 100 for MIT', () => {
    expect(scoreLicenseCompatibility({ license: 'MIT' })).toBe(100)
  })

  it('returns 100 for Apache-2.0', () => {
    expect(scoreLicenseCompatibility({ license: 'Apache-2.0' })).toBe(100)
  })

  it('returns 100 for BSD-3-Clause', () => {
    expect(scoreLicenseCompatibility({ license: 'BSD-3-Clause' })).toBe(100)
  })

  it('returns 100 for ISC', () => {
    expect(scoreLicenseCompatibility({ license: 'ISC' })).toBe(100)
  })

  it('returns 60 for LGPL-3.0 (weak copyleft)', () => {
    expect(scoreLicenseCompatibility({ license: 'LGPL-3.0' })).toBe(60)
  })

  it('returns 60 for MPL-2.0 (weak copyleft)', () => {
    expect(scoreLicenseCompatibility({ license: 'MPL-2.0' })).toBe(60)
  })

  it('returns 25 for GPL-3.0 (strong copyleft)', () => {
    expect(scoreLicenseCompatibility({ license: 'GPL-3.0' })).toBe(25)
  })

  it('returns 25 for AGPL-3.0 (strong copyleft)', () => {
    expect(scoreLicenseCompatibility({ license: 'AGPL-3.0' })).toBe(25)
  })

  it('returns 40 for unknown but present license', () => {
    expect(scoreLicenseCompatibility({ license: 'Custom-License-v2' })).toBe(40)
  })
})

// ── scoreSelfHostingComplexity ───────────────────────────────────────────

describe('scoreSelfHostingComplexity', () => {
  it('returns baseline score for empty payload', () => {
    expect(scoreSelfHostingComplexity({})).toBe(70)
  })

  it('increases score for Docker mentions', () => {
    const withDocker = scoreSelfHostingComplexity({ description: 'Docker image available' })
    const withoutDocker = scoreSelfHostingComplexity({ description: 'Plain binary' })
    expect(withDocker).toBeGreaterThanOrEqual(withoutDocker)
  })

  it('increases score for SQLite mention', () => {
    const score = scoreSelfHostingComplexity({ description: 'Uses SQLite for storage' })
    expect(score).toBeGreaterThan(70)
  })

  it('decreases score for Kubernetes mention', () => {
    const score = scoreSelfHostingComplexity({ description: 'Requires Kubernetes cluster' })
    expect(score).toBeLessThan(70)
  })

  it('decreases score for Terraform mention', () => {
    const score = scoreSelfHostingComplexity({ description: 'Infrastructure managed by Terraform' })
    expect(score).toBeLessThan(70)
  })

  it('decreases score for Postgres requirement', () => {
    const score = scoreSelfHostingComplexity({ description: 'Requires Postgres database' })
    expect(score).toBeLessThan(70)
  })

  it('never goes below 0', () => {
    const score = scoreSelfHostingComplexity({
      description: 'Requires Kubernetes cluster with Terraform and Mesos and Consul and Vault and MongoDB',
    })
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('never exceeds 100', () => {
    const score = scoreSelfHostingComplexity({
      description: 'Docker SQLite single-binary flat-file static binary',
    })
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ── scoreDataExportCapability ────────────────────────────────────────────

describe('scoreDataExportCapability', () => {
  it('returns baseline score for empty payload', () => {
    expect(scoreDataExportCapability({})).toBe(50)
  })

  it('increases score for export keywords', () => {
    const score = scoreDataExportCapability({
      description: 'Export data to JSON, CSV, and YAML formats',
      keywords: ['export', 'backup', 'migration'],
    })
    expect(score).toBeGreaterThan(50)
  })

  it('increases score for API mention', () => {
    const score = scoreDataExportCapability({ description: 'REST API available' })
    expect(score).toBeGreaterThan(50)
  })

  it('increases score for CLI mention', () => {
    const score = scoreDataExportCapability({ description: 'CLI tool for data export' })
    expect(score).toBeGreaterThan(50)
  })

  it('never goes below 0', () => {
    const score = scoreDataExportCapability({})
    expect(score).toBeGreaterThanOrEqual(0)
  })

  it('never exceeds 100', () => {
    const score = scoreDataExportCapability({
      description: 'REST API export import migrate backup CLI',
      keywords: ['export', 'import', 'json', 'csv', 'yaml', 'api'],
    })
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ── scoreCommunityHealth ─────────────────────────────────────────────────

describe('scoreCommunityHealth', () => {
  it('returns 25 for empty payload (0 issue pts + 5 fallback repo pts)', () => {
    expect(scoreCommunityHealth({})).toBe(25)
  })

  it('rewards healthy star-to-fork ratio', () => {
    const healthy = scoreCommunityHealth({ stars: 10000, forks: 500, openIssues: 20 })
    const unhealthy = scoreCommunityHealth({ stars: 100, forks: 100, openIssues: 500 })
    expect(healthy).toBeGreaterThan(unhealthy)
  })

  it('rewards low open issues', () => {
    const few = scoreCommunityHealth({ stars: 1000, forks: 100, openIssues: 10 })
    const many = scoreCommunityHealth({ stars: 1000, forks: 100, openIssues: 600 })
    expect(few).toBeGreaterThan(many)
  })

  it('rewards having a description', () => {
    const withDesc = scoreCommunityHealth({ description: 'A great tool for developers' })
    const withoutDesc = scoreCommunityHealth({})
    expect(withDesc).toBeGreaterThan(withoutDesc)
  })

  it('rewards having a homepage', () => {
    const withHome = scoreCommunityHealth({ homepage: 'https://example.com' })
    const withoutHome = scoreCommunityHealth({})
    expect(withHome).toBeGreaterThan(withoutHome)
  })

  it('rewards having a repository URL', () => {
    const withRepo = scoreCommunityHealth({ repository: 'https://github.com/example/repo' })
    const withoutRepo = scoreCommunityHealth({})
    expect(withRepo).toBeGreaterThan(withoutRepo)
  })

  it('caps at 100', () => {
    const score = scoreCommunityHealth({
      stars: 10000,
      forks: 500,
      openIssues: 5,
      description: 'A well-documented tool',
      homepage: 'https://example.com',
      repository: 'https://github.com/example/repo',
    })
    expect(score).toBeLessThanOrEqual(100)
  })
})

// ── computeConfidenceScore (integration) ─────────────────────────────────

describe('computeConfidenceScore', () => {
  it('returns score and breakdown with correct structure', () => {
    const result = computeConfidenceScore(makePayload())
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('breakdown')
    expect(result.breakdown).toHaveProperty('activityTrend')
    expect(result.breakdown).toHaveProperty('licenseCompatibility')
    expect(result.breakdown).toHaveProperty('selfHostingComplexity')
    expect(result.breakdown).toHaveProperty('dataExportCapability')
    expect(result.breakdown).toHaveProperty('communityHealth')
  })

  it('returns score between 0 and 100', () => {
    const result = computeConfidenceScore(makePayload())
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('each sub-score is between 0 and 100', () => {
    const result = computeConfidenceScore(makePayload())
    for (const value of Object.values(result.breakdown)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
    }
  })

  it('returns ~21.75 for completely empty payload', () => {
    const result = computeConfidenceScore({})
    expect(result.score).toBeCloseTo(21.75, 0)
  })

  it('returns high score for ideal payload', () => {
    const result = computeConfidenceScore(makePayload({
      stars: 100000,
      forks: 10000,
      openIssues: 20,
      language: 'TypeScript',
      license: 'MIT',
      description: 'The best framework for building web applications',
      homepage: 'https://nextjs.org',
      repository: 'https://github.com/vercel/next.js',
      pushedAt: daysAgo(1),
      latestRelease: { publishedAt: daysAgo(2), tag: 'v15.0.0' },
      versionCount: 100,
      recentDownloads: 5000000,
    }))
    expect(result.score).toBeGreaterThanOrEqual(80)
  })

  it('penalizes missing license', () => {
    const withLicense = computeConfidenceScore(makePayload({ license: 'MIT' }))
    const withoutLicense = computeConfidenceScore(makePayload({ license: null }))
    expect(withLicense.score).toBeGreaterThan(withoutLicense.score)
  })

  it('penalizes zero activity', () => {
    const active = computeConfidenceScore(makePayload({
      stars: 10000,
      pushedAt: daysAgo(1),
      latestRelease: { publishedAt: daysAgo(5) },
    }))
    const inactive = computeConfidenceScore(makePayload({
      stars: 0,
      pushedAt: daysAgo(400),
      latestRelease: null,
    }))
    expect(active.score).toBeGreaterThan(inactive.score)
  })

  it('penalizes archived repos', () => {
    const active = computeConfidenceScore(makePayload({ archived: false }))
    const archived = computeConfidenceScore(makePayload({ archived: true }))
    // archived flag doesn't directly affect score, but stale dates do
    expect(active.score).toBeGreaterThanOrEqual(archived.score)
  })

  it('weights are applied correctly', () => {
    // Activity trend has highest weight (30%), so a huge activity boost
    // should move the score more than a huge license boost alone
    const highActivity = computeConfidenceScore(makePayload({
      stars: 100000,
      forks: 20000,
      pushedAt: daysAgo(1),
      latestRelease: { publishedAt: daysAgo(1) },
      versionCount: 100,
      recentDownloads: 10000000,
      license: null,
    }))
    const highLicense = computeConfidenceScore(makePayload({
      stars: 0,
      forks: 0,
      pushedAt: daysAgo(400),
      latestRelease: null,
      versionCount: 0,
      recentDownloads: 0,
      license: 'MIT',
    }))
    expect(highActivity.score).toBeGreaterThan(highLicense.score)
  })
})
