import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Categories } from '@/app/db/schema'
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
  const categoryId = parseInt(id, 10)
  if (isNaN(categoryId)) {
    return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Categories)
    .where(eq(Categories.id, categoryId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  const before = rows[0]
  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.slug !== undefined) updateData.slug = body.slug
  if (body.description !== undefined) updateData.description = body.description
  if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle
  if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription
  if (body.seoCanonicalUrl !== undefined) updateData.seoCanonicalUrl = body.seoCanonicalUrl

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  await db
    .update(Categories)
    .set(updateData)
    .where(eq(Categories.id, categoryId))

  const after = await db
    .select()
    .from(Categories)
    .where(eq(Categories.id, categoryId))
    .limit(1)

  await logAudit(ctx.userId, 'admin.category.updated', 'category', String(categoryId), before, after[0])

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
  const categoryId = parseInt(id, 10)
  if (isNaN(categoryId)) {
    return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Categories)
    .where(eq(Categories.id, categoryId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 })
  }

  const before = rows[0]

  await db.delete(Categories).where(eq(Categories.id, categoryId))

  await logAudit(ctx.userId, 'admin.category.deleted', 'category', String(categoryId), before)

  return NextResponse.json({ success: true })
}
