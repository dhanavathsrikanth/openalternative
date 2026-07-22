import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchNpmPackage } from '@/lib/fetchers/npm'

const mockNpmResponse = {
  description: 'The React Framework for the Web',
  'dist-tags': { latest: '14.0.4' },
  versions: {
    '14.0.4': {
      license: 'MIT',
      homepage: 'https://nextjs.org',
      dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
      devDependencies: { typescript: '^5.0.0' },
    },
    '14.0.3': { license: 'MIT' },
  },
  homepage: 'https://nextjs.org',
  repository: { url: 'https://github.com/vercel/next.js.git' },
  keywords: ['react', 'framework'],
  time: {
    created: '2016-10-26T20:26:46Z',
    modified: '2024-01-15T10:00:00Z',
  },
}

describe('fetchNpmPackage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches npm package metadata successfully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockNpmResponse), { status: 200 }),
    )

    const result = await fetchNpmPackage('next')

    expect(result.identifier).toBe('next')
    expect(result.payload).toMatchObject({
      source: 'npm',
      name: 'next',
      description: 'The React Framework for the Web',
      latestVersion: '14.0.4',
      versionCount: 2,
      license: 'MIT',
      dependencies: 2,
      devDependencies: 1,
      keywords: ['react', 'framework'],
    })
  })

  it('throws on non-ok status', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    )

    await expect(fetchNpmPackage('nonexistent-pkg')).rejects.toThrow('npm API 404')
  })
})
