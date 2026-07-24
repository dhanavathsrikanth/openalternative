import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Collections } from '@/app/db/schema'
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
  const collectionId = parseInt(id, 10)
  if (isNaN(collectionId)) {
    return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Collections)
    .where(eq(Collections.id, collectionId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const before = rows[0]
  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if (body.title !== undefined) updateData.title = body.title
  if (body.slug !== undefined) updateData.slug = body.slug
  if (body.description !== undefined) updateData.description = body.description
  if (body.curationType !== undefined) updateData.curationType = body.curationType
  updateData.updatedAt = new Date()

  if (Object.keys(updateData).length === 1) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  await db
    .update(Collections)
    .set(updateData)
    .where(eq(Collections.id, collectionId))

  const after = await db
    .select()
    .from(Collections)
    .where(eq(Collections.id, collectionId))
    .limit(1)

  await logAudit(ctx.userId, 'admin.collection.updated', 'collection', String(collectionId), before, after[0])

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
  const collectionId = parseInt(id, 10)
  if (isNaN(collectionId)) {
    return NextResponse.json({ error: 'Invalid collection ID' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Collections)
    .where(eq(Collections.id, collectionId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
  }

  const before = rows[0]

  await db.delete(Collections).where(eq(Collections.id, collectionId))

  await logAudit(ctx.userId, 'admin.collection.deleted', 'collection', String(collectionId), before)

  return NextResponse.json({ success: true })
}
