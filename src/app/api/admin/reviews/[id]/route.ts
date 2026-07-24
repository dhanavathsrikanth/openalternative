import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Reviews } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const reviewId = parseInt(id, 10)
  if (isNaN(reviewId)) {
    return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Reviews)
    .where(eq(Reviews.id, reviewId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  const before = rows[0]

  await db.delete(Reviews).where(eq(Reviews.id, reviewId))

  await logAudit(ctx.userId, 'admin.review.deleted', 'review', String(reviewId), before)

  return NextResponse.json({ success: true })
}
