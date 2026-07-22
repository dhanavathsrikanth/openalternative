import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCrate } from '@/lib/fetchers/crates'

const mockCratesResponse = {
  crate: {
    name: 'tokio',
    description: 'An asynchronous runtime for the Rust programming language',
    max_version: '1.35.0',
    downloads: 200000000,
    recent_downloads: 5000000,
    repository: 'https://github.com/tokio-rs/tokio',
    homepage: 'https://tokio.rs',
    license: 'MIT',
    categories: ['asynchronous', 'network-programming'],
    keywords: ['async', 'runtime', 'futures'],
    created_at: '2016-03-01T00:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
}

describe('fetchCrate', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches crate metadata successfully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockCratesResponse), { status: 200 }),
    )

    const result = await fetchCrate('tokio')

    expect(result.identifier).toBe('tokio')
    expect(result.payload).toMatchObject({
      source: 'crates',
      name: 'tokio',
      description: 'An asynchronous runtime for the Rust programming language',
      version: '1.35.0',
      downloads: 200000000,
      recentDownloads: 5000000,
      repository: 'https://github.com/tokio-rs/tokio',
      homepage: 'https://tokio.rs',
      license: 'MIT',
      categories: ['asynchronous', 'network-programming'],
      keywords: ['async', 'runtime', 'futures'],
    })
  })

  it('throws on non-ok status', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    )

    await expect(fetchCrate('nonexistent-crate')).rejects.toThrow('crates.io API 404')
  })
})
