import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { NextResponse } from 'next/server'

// Use vi.hoisted so the mock is available when vi.mock factories run
const { authMock, dbSelectMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  dbSelectMock: vi.fn(),
}))

vi.mock('@/app/db', () => ({
  db: {
    select: dbSelectMock,
  },
}))

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({
  clerkMiddleware: vi.fn(
    (cb: (auth: () => Promise<{ userId: string | null; orgId?: string | null }>, req: NextRequest) => unknown) =>
      (req: NextRequest, _event?: unknown) => cb(authMock, req),
  ),
  createRouteMatcher: vi.fn((patterns: string[]) => {
    const prefixes = patterns.map((p) => {
      const m = p.match(/^\/([^(.]+)/)
      return m ? '/' + m[1] : p
    })
    return (req: NextRequest) => {
      const pathname = req.nextUrl.pathname
      return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
    }
  }),
}))

import proxy, { config } from '@/proxy'

const run = proxy as unknown as (req: NextRequest) => Promise<Response>

function req(pathname: string, opts?: { method?: string; headers?: Record<string, string> }) {
  return new NextRequest(`http://localhost${pathname}`, {
    method: opts?.method ?? 'GET',
    headers: opts?.headers,
  })
}

// ─── Matcher coverage ────────────────────────────────────────────────────────

describe('proxy config.matcher', () => {
  it('has a catch-all matcher for all routes', () => {
    expect(config.matcher.length).toBeGreaterThanOrEqual(1)
  })

  it('has an API matcher', () => {
    expect(config.matcher).toContain('/(api|trpc)(.*)')
  })
})

// ─── /internal/* — CRON_SECRET gate ──────────────────────────────────────────

describe('/internal/* — CRON_SECRET auth', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.CRON_SECRET = 'test-secret-123'
  })

  it('returns 401 when no Authorization header is present', async () => {
    const res = (await run(req('/internal/moderation'))) as NextResponse
    expect(res.status).toBe(401)
  })

  it('returns 401 for an incorrect Bearer token', async () => {
    const res = (await run(
      req('/internal/moderation', { headers: { authorization: 'Bearer wrong' } }),
    )) as NextResponse
    expect(res.status).toBe(401)
  })

  it('passes through when the correct Bearer token is supplied', async () => {
    const res = (await run(
      req('/internal/moderation', { headers: { authorization: 'Bearer test-secret-123' } }),
    )) as NextResponse
    expect(res.status).toBe(200)
  })

  it('returns 401 when CRON_SECRET is undefined', async () => {
    delete process.env.CRON_SECRET
    const res = (await run(
      req('/internal/moderation', { headers: { authorization: 'Bearer test-secret-123' } }),
    )) as NextResponse
    expect(res.status).toBe(401)
  })
})

// ─── /contributor — Clerk session gate ───────────────────────────────────────

describe('/contributor — Clerk auth', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('redirects to /contributor/sign-in when userId is null', async () => {
    authMock.mockResolvedValueOnce({ userId: null })
    const res = (await run(req('/contributor'))) as NextResponse
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/contributor/sign-in')
  })

  it('passes through when userId is present', async () => {
    authMock.mockResolvedValueOnce({ userId: 'user_test' })
    const res = (await run(req('/contributor'))) as NextResponse
    expect(res.status).toBe(200)
  })
})

// ─── POST /api/reviews — Clerk session gate ──────────────────────────────────

describe('POST /api/reviews — Clerk auth', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns 401 for unauthenticated POST', async () => {
    authMock.mockResolvedValueOnce({ userId: null })
    const res = (await run(req('/api/reviews', { method: 'POST' }))) as NextResponse
    expect(res.status).toBe(401)
  })

  it('passes authenticated POST through', async () => {
    authMock.mockResolvedValueOnce({ userId: 'user_test' })
    const res = (await run(req('/api/reviews', { method: 'POST' }))) as NextResponse
    expect(res.status).toBe(200)
  })

  it('passes unauthenticated GET through (public)', async () => {
    const res = (await run(req('/api/reviews'))) as NextResponse
    expect(res.status).toBe(200)
  })
})

// ─── POST /api/contributions — Clerk session gate ────────────────────────────

describe('POST /api/contributions — Clerk auth', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns 401 for unauthenticated POST', async () => {
    authMock.mockResolvedValueOnce({ userId: null })
    const res = (await run(req('/api/contributions', { method: 'POST' }))) as NextResponse
    expect(res.status).toBe(401)
  })

  it('passes authenticated POST through', async () => {
    authMock.mockResolvedValueOnce({ userId: 'user_test' })
    const res = (await run(req('/api/contributions', { method: 'POST' }))) as NextResponse
    expect(res.status).toBe(200)
  })

  it('passes unauthenticated GET through (public)', async () => {
    const res = (await run(req('/api/contributions'))) as NextResponse
    expect(res.status).toBe(200)
  })
})

// ─── /dashboard/** — Clerk session + org gate ──────────────────────────────────

describe('/dashboard/* — Clerk auth + org', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    dbSelectMock.mockReset()
  })

  it('redirects to /sign-in when userId is null', async () => {
    authMock.mockResolvedValueOnce({ userId: null, orgId: null })
    const res = (await run(req('/dashboard/my-org/products'))) as NextResponse
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/sign-in')
  })

  it('redirects to / when userId exists but orgId is null', async () => {
    authMock.mockResolvedValueOnce({ userId: 'user_1', orgId: null })
    const res = (await run(req('/dashboard/my-org/products'))) as NextResponse
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('passes through when both userId and orgId are present', async () => {
    authMock.mockResolvedValueOnce({ userId: 'user_1', orgId: 'org_1' })
    const res = (await run(req('/dashboard/my-org/products'))) as NextResponse
    expect(res.status).toBe(200)
  })
})

// ─── /admin/** — Clerk session + staff gate ───────────────────────────────────

describe('/admin/* — Clerk auth + staff', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    dbSelectMock.mockReset()
  })

  it('redirects to /sign-in when userId is null', async () => {
    authMock.mockResolvedValueOnce({ userId: null, orgId: null })
    const res = (await run(req('/admin/products'))) as NextResponse
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/sign-in')
  })

  it('redirects to / when user is not staff', async () => {
    authMock.mockResolvedValueOnce({ userId: 'user_1', orgId: null })
    dbSelectMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ staff: false }]),
        }),
      }),
    })
    const res = (await run(req('/admin/products'))) as NextResponse
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('redirects to / when user does not exist in users table', async () => {
    authMock.mockResolvedValueOnce({ userId: 'user_1', orgId: null })
    dbSelectMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    })
    const res = (await run(req('/admin/products'))) as NextResponse
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/')
  })

  it('passes through when user is staff', async () => {
    authMock.mockResolvedValueOnce({ userId: 'user_1', orgId: null })
    dbSelectMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ staff: true }]),
        }),
      }),
    })
    const res = (await run(req('/admin/products'))) as NextResponse
    expect(res.status).toBe(200)
  })
})

// ─── Public routes: zero auth friction ────────────────────────────────────────

describe('public routes — completely untouched by auth', () => {
  beforeEach(() => {
    dbSelectMock.mockReset()
  })

  const publicRoutes = [
    '/',
    '/products',
    '/products/nextjs',
    '/categories',
    '/categories/web-frameworks',
    '/compare',
    '/compare/nextjs-vs-remix',
    '/contributors',
    '/methodology',
    '/search',
    '/sign-in',
    '/sign-up',
    '/contributor/sign-in',
    '/contributor/sign-up',
    '/llms.txt',
    '/api/search',
    '/api/newsletter',
    '/api/sentry-example-api',
    '/api/webhooks/clerk',
    '/api/cron/ingest-github',
    '/api/cron/ingest-npm',
    '/api/cron/ingest-pypi',
    '/api/cron/ingest-crates',
    '/api/cron/normalize',
    '/api/cron/digest',
    '/api/contributions/42',
  ]

  it.each(publicRoutes)('%s is reachable without any auth', async (route) => {
    const res = (await run(req(route))) as NextResponse
    expect(res.status).toBe(200)
  })
})
