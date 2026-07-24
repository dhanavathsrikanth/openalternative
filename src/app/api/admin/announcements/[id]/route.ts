import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Announcements } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const announcementId = parseInt(id, 10)
  if (isNaN(announcementId)) {
    return NextResponse.json({ error: 'Invalid announcement ID' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Announcements)
    .where(eq(Announcements.id, announcementId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
  }

  const before = rows[0]
  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if (body.title !== undefined) updateData.title = body.title
  if (body.body !== undefined) updateData.body = body.body
  updateData.updatedAt = new Date()

  if (Object.keys(updateData).length === 1) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  await db
    .update(Announcements)
    .set(updateData)
    .where(eq(Announcements.id, announcementId))

  const after = await db
    .select()
    .from(Announcements)
    .where(eq(Announcements.id, announcementId))
    .limit(1)

  await logAudit(ctx.userId, 'admin.announcement.updated', 'announcement', String(announcementId), before, after[0])

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const announcementId = parseInt(id, 10)
  if (isNaN(announcementId)) {
    return NextResponse.json({ error: 'Invalid announcement ID' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Announcements)
    .where(eq(Announcements.id, announcementId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
  }

  const before = rows[0]

  await db.delete(Announcements).where(eq(Announcements.id, announcementId))

  await logAudit(ctx.userId, 'admin.announcement.deleted', 'announcement', String(announcementId), before)

  return NextResponse.json({ success: true })
}
