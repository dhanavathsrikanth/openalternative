import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/app/db'
import { AnalyticsEvents, Products, Organizations } from '@/app/db/schema'
import { eq, sql } from 'drizzle-orm'

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

  const { searchParams } = new URL(req.url)
  const daysParam = searchParams.get('days')
  const days = daysParam ? parseInt(daysParam, 10) : 30
  const since = new Date()
  since.setDate(since.getDate() - days)

  const result = await db.execute(sql`
    SELECT
      ae.id,
      p.name AS product_name,
      p.slug AS product_slug,
      ae.event_type,
      ae.occurred_at,
      ae.metadata
    FROM analytics_events ae
    JOIN products p ON p.id = ae.product_id
    WHERE ae.product_id IN (SELECT id FROM products WHERE claimed_by_org_id = ${org.id})
      AND ae.occurred_at >= ${since}
    ORDER BY ae.occurred_at DESC
  `)

  const rows = (result as unknown as { rows: Record<string, unknown>[] }).rows ?? []

  const header = 'id,product_name,product_slug,event_type,occurred_at,metadata\n'
  const csvBody = rows.map((r) => {
    const meta = typeof r.metadata === 'string' ? r.metadata : JSON.stringify(r.metadata ?? {})
    const escaped = (val: unknown) => {
      const s = String(val ?? '')
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
    }
    return [
      r.id,
      escaped(r.product_name),
      escaped(r.product_slug),
      escaped(r.event_type),
      escaped(r.occurred_at),
      escaped(meta),
    ].join(',')
  }).join('\n')

  return new NextResponse(header + csvBody, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics-export-${days}d.csv"`,
    },
  })
}
