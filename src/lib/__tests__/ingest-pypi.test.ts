import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchPypiPackage } from '@/lib/fetchers/pypi'

const mockPypiResponse = {
  info: {
    name: 'fastapi',
    summary: 'FastAPI framework, high performance, easy to learn, fast to code, ready for production',
    version: '0.104.1',
    license: 'MIT',
    homepage: 'https://fastapi.tiangolo.com/',
    project_url: 'https://github.com/tiangolo/fastapi',
    requires_python: '>=3.8',
    requires_dist: ['pydantic!=1.8', 'starlette', 'uvicorn'],
    author: 'Sebastián Ramírez',
    classifiers: [
      'Development Status :: 4 - Beta',
      'Framework :: FastAPI',
    ],
  },
  releases: {
    '0.104.1': [{ size: 100000 }],
    '0.104.0': [{ size: 95000 }],
    '0.103.0': [{ size: 90000 }],
  },
}

describe('fetchPypiPackage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches PyPI package metadata successfully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockPypiResponse), { status: 200 }),
    )

    const result = await fetchPypiPackage('fastapi')

    expect(result.identifier).toBe('fastapi')
    expect(result.payload).toMatchObject({
      source: 'pypi',
      name: 'fastapi',
      summary: expect.stringContaining('FastAPI'),
      version: '0.104.1',
      versionCount: 3,
      license: 'MIT',
      requiresPython: '>=3.8',
      dependencies: 3,
      author: 'Sebastián Ramírez',
    })
  })

  it('throws on non-ok status', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    )

    await expect(fetchPypiPackage('nonexistent-pkg')).rejects.toThrow('PyPI API 404')
  })
})
