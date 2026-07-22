import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchGitHubRepo } from '@/lib/fetchers/github'

const mockRepoResponse = {
  stargazers_count: 100000,
  forks_count: 20000,
  open_issues_count: 500,
  language: 'TypeScript',
  license: { spdx_id: 'MIT' },
  description: 'The React Framework',
  homepage: 'https://nextjs.org',
  default_branch: 'canary',
  created_at: '2016-10-26T20:26:46Z',
  pushed_at: '2024-01-15T10:00:00Z',
}

const mockReleaseResponse = {
  tag_name: 'v14.0.4',
  published_at: '2024-01-12T10:00:00Z',
}

describe('fetchGitHubRepo', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches repo and release data successfully', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: string | URL | Request) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u.includes('/releases/latest')) {
        return new Response(JSON.stringify(mockReleaseResponse), { status: 200 })
      }
      return new Response(JSON.stringify(mockRepoResponse), { status: 200 })
    })

    const result = await fetchGitHubRepo('vercel', 'next.js')

    expect(result.identifier).toBe('vercel/next.js')
    expect(result.payload).toMatchObject({
      source: 'github',
      stars: 100000,
      forks: 20000,
      openIssues: 500,
      language: 'TypeScript',
      license: 'MIT',
      latestRelease: {
        tag: 'v14.0.4',
        publishedAt: '2024-01-12T10:00:00Z',
      },
    })
  })

  it('handles missing release gracefully', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (url: string | URL | Request) => {
      const u = typeof url === 'string' ? url : url.toString()
      if (u.includes('/releases/latest')) {
        return new Response('Not Found', { status: 404 })
      }
      return new Response(JSON.stringify(mockRepoResponse), { status: 200 })
    })

    const result = await fetchGitHubRepo('vercel', 'next.js')
    expect(result.payload.latestRelease).toBeNull()
  })

  it('throws on rate limit (403)', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('rate limited', {
        status: 403,
        headers: { 'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 60) },
      }),
    )

    await expect(fetchGitHubRepo('vercel', 'next.js')).rejects.toThrow('rate limited')
  })

  it('throws on non-ok status', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    )

    await expect(fetchGitHubRepo('vercel', 'nonexistent')).rejects.toThrow('GitHub API 404')
  })
})
