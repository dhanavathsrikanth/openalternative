import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Reports } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'
import { withAudit } from '@/lib/audit'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const reportId = parseInt(id, 10)
  if (isNaN(reportId)) {
    return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 })
  }

  const body = await req.json()
  const { status } = body

  if (status !== 'resolved' && status !== 'dismissed') {
    return NextResponse.json({ error: 'status must be "resolved" or "dismissed"' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Reports)
    .where(eq(Reports.id, reportId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }

  const report = rows[0]

  await withAudit(
    ctx.userId,
    `report.${status}`,
    'report',
    String(reportId),
    async () => ({ ...report }),
    async (tx) => {
      await tx
        .update(Reports)
        .set({
          status,
          resolverId: ctx.userId,
          ...(status === 'resolved' ? { resolvedAt: new Date() } : {}),
        })
        .where(eq(Reports.id, reportId))
    },
  )

  return NextResponse.json({ message: `Report ${status}` })
}