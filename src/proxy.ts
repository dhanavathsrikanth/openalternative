import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { db } from '@/app/db'
import { Users } from '@/app/db/schema'
import { eq } from 'drizzle-orm'

const handleI18nRouting = createMiddleware(routing)

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isSignInRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/contributor/sign-in(.*)', '/contributor/sign-up(.*)'])
const isApiRoute = createRouteMatcher(['/api(.*)', '/internal(.*)', '/sentry-tunnel(.*)', '/ingest(.*)'])

function isInternalRoute(pathname: string): boolean {
  return pathname.startsWith('/internal')
}

function isContributorRoute(pathname: string): boolean {
  return pathname === '/contributor'
}

function isProtectedPostApi(pathname: string, method: string): boolean {
  if (method !== 'POST') return false
  return pathname === '/api/reviews' || pathname === '/api/contributions'
}

function verifyCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('CRON_SECRET env var is not set')
    return false
  }
  return req.headers.get('authorization') === `Bearer ${secret}`
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl

  // /internal/** — staff-only; gate behind CRON_SECRET Bearer auth
  if (isInternalRoute(pathname)) {
    if (!verifyCronSecret(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // /dashboard/** — require Clerk auth + org membership
  if (isDashboardRoute(req)) {
    const { userId, orgId } = await auth()
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }
    if (!orgId) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // /admin/** — require Clerk auth + staff flag
  if (isAdminRoute(req)) {
    const { userId } = await auth()
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }
    const rows = await db
      .select({ staff: Users.staff })
      .from(Users)
      .where(eq(Users.id, userId))
      .limit(1)
    if (rows.length === 0 || !rows[0].staff) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // /contributor — Clerk-authenticated page; redirect to sign-in if not signed in
  if (isContributorRoute(pathname)) {
    const { userId } = await auth()
    if (!userId) {
      const signInUrl = new URL('/contributor/sign-in', req.url)
      return NextResponse.redirect(signInUrl)
    }
    return NextResponse.next()
  }

  // POST /api/reviews and POST /api/contributions — Clerk-authenticated API routes
  if (isProtectedPostApi(pathname, req.method)) {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // For non-API, non-admin, non-dashboard routes: apply i18n locale detection
  if (!isApiRoute(req) && !isSignInRoute(req)) {
    const i18nResponse = handleI18nRouting(req)
    // Only use the i18n response if it's a redirect (locale detection)
    // or if the pathname doesn't already have a locale prefix
    if (i18nResponse && i18nResponse.status === 307 || i18nResponse.status === 308) {
      return i18nResponse
    }
    // For pages that already have a locale prefix, pass through
    const localePrefixes = routing.locales.map((l) => `/${l}/`)
    const hasLocalePrefix = localePrefixes.some((p) => pathname.startsWith(p)) || routing.locales.some((l) => pathname === `/${l}`)
    if (!hasLocalePrefix) {
      return i18nResponse
    }
  }

  // Everything else: public routes pass through untouched
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
