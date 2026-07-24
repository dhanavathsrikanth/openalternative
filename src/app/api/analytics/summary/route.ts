import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/app/db'
import { AnalyticsEvents, Products, Organizations } from '@/app/db/schema'
import { eq, and, sql, gte } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session.userId || !session.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgRows = await db
    .select()
    .from(Organizations)
    .where(eq(Organizations.clerkOrgId, session.orgId))
    .limit(1)

  if (orgRows.length === 0) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const org = orgRows[0]

  const claimedProductIds = db
    .select({ id: Products.id })
    .from(Products)
    .where(eq(Products.claimedByOrgId, org.id))

  const { searchParams } = new URL(req.url)
  const daysParam = searchParams.get('days')
  const days = daysParam ? parseInt(daysParam, 10) : 30

  const since = new Date()
  since.setDate(since.getDate() - days)

  const eventAlias = AnalyticsEvents

  const summaryResult = await db.execute(sql`
    SELECT
      event_type,
      COUNT(*)::int AS count
    FROM analytics_events
    WHERE product_id IN (SELECT id FROM products WHERE claimed_by_org_id = ${org.id})
      AND occurred_at >= ${since}
    GROUP BY event_type
  `)

  const rows = (summaryResult as unknown as { rows: { event_type: string; count: number }[] }).rows ?? []
  const summary: Record<string, number> = {}
  for (const row of rows) {
    summary[row.event_type] = row.count
  }

  const trendResult = await db.execute(sql`
    SELECT
      date_trunc('day', occurred_at)::date AS day,
      event_type,
      COUNT(*)::int AS count
    FROM analytics_events
    WHERE product_id IN (SELECT id FROM products WHERE claimed_by_org_id = ${org.id})
      AND occurred_at >= ${since}
    GROUP BY day, event_type
    ORDER BY day ASC
  `)

  const trendRows = (trendResult as unknown as { rows: { day: string; event_type: string; count: number }[] }).rows ?? []
  const trendMap = new Map<string, { day: string; pageViews: number; outboundClicks: number }>()
  for (const row of trendRows) {
    const key = row.day
    if (!trendMap.has(key)) {
      trendMap.set(key, { day: key, pageViews: 0, outboundClicks: 0 })
    }
    const entry = trendMap.get(key)!
    if (row.event_type === 'page_view') {
      entry.pageViews = row.count
    } else if (row.event_type === 'outbound_click') {
      entry.outboundClicks = row.count
    }
  }
  const trend = Array.from(trendMap.values())

  const referralResult = await db.execute(sql`
    SELECT
      COALESCE(metadata->>'path', 'unknown') AS referral_source,
      COUNT(*)::int AS count
    FROM analytics_events
    WHERE product_id IN (SELECT id FROM products WHERE claimed_by_org_id = ${org.id})
      AND event_type = 'page_view'
      AND occurred_at >= ${since}
    GROUP BY referral_source
    ORDER BY count DESC
    LIMIT 20
  `)

  const referralRows = (referralResult as unknown as { rows: { referral_source: string; count: number }[] }).rows ?? []

  return NextResponse.json({
    summary,
    trend,
    referrals: referralRows,
  })
}
