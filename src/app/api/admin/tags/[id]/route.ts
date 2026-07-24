import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Tags } from '@/app/db/schema'
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
  const tagId = parseInt(id, 10)
  if (isNaN(tagId)) {
    return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Tags)
    .where(eq(Tags.id, tagId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
  }

  const before = rows[0]
  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.slug !== undefined) updateData.slug = body.slug

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  await db
    .update(Tags)
    .set(updateData)
    .where(eq(Tags.id, tagId))

  const after = await db
    .select()
    .from(Tags)
    .where(eq(Tags.id, tagId))
    .limit(1)

  await logAudit(ctx.userId, 'admin.tag.updated', 'tag', String(tagId), before, after[0])

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
  const tagId = parseInt(id, 10)
  if (isNaN(tagId)) {
    return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Tags)
    .where(eq(Tags.id, tagId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 })
  }

  const before = rows[0]

  await db.delete(Tags).where(eq(Tags.id, tagId))

  await logAudit(ctx.userId, 'admin.tag.deleted', 'tag', String(tagId), before)

  return NextResponse.json({ success: true })
}
