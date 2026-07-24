import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products, ProductCategories, ProductTags, ProductAssets } from '@/app/db/schema'
import { eq, sql } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { validatePublishable } from '@/lib/validation/product'
import { validateContentBlocks } from '@/lib/validation/content-blocks'
import { revalidatePath } from 'next/cache'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const productId = parseInt(id, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Products)
    .where(eq(Products.id, productId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const before = rows[0]
  const body = await req.json()

  // ── Scalar field updates ───────────────────────────────────────────
  const SCALAR_FIELDS = [
    'name', 'slug', 'tagline', 'description',
    'githubUrl', 'homepageUrl', 'docsUrl', 'changelogUrl', 'communityUrl',
    'license', 'primaryLanguage',
    'seoTitle', 'seoDescription', 'seoCanonicalUrl',
  ] as const

  const updateData: Record<string, unknown> = {}
  for (const field of SCALAR_FIELDS) {
    if (field in body) {
      const val = body[field]
      updateData[field] = val === '' || val === undefined ? null : String(val).trim()
    }
  }

  // FAQ (jsonb)
  if ('faq' in body) {
    updateData.faq = body.faq ?? null
  }

  // Content Blocks (jsonb)
  if ('contentBlocks' in body) {
    if (body.contentBlocks != null) {
      const validation = validateContentBlocks(body.contentBlocks)
      if (!validation.valid) {
        return NextResponse.json(
          { error: 'Invalid content blocks', details: validation.errors },
          { status: 422 },
        )
      }
    }
    updateData.contentBlocks = body.contentBlocks ?? null
    updateData.contentUpdatedAt = new Date()
  }

  // Status
  if ('status' in body && (body.status === 'draft' || body.status === 'published')) {
    updateData.status = body.status
  }

  // ── Publish gate ────────────────────────────────────────────────────
  if (body.status === 'published') {
    const merged = { ...before, ...updateData }

    const [catRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ProductCategories)
      .where(eq(ProductCategories.productId, productId))

    const [tagRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ProductTags)
      .where(eq(ProductTags.productId, productId))

    const [logoRow] = await db
      .select({ url: ProductAssets.url })
      .from(ProductAssets)
      .where(eq(ProductAssets.productId, productId))
      .limit(1)

    const errors = validatePublishable({
      name: merged.name,
      slug: merged.slug,
      tagline: merged.tagline,
      description: merged.description,
      logoUrl: logoRow?.url ?? null,
      categoryCount: catRow?.count ?? 0,
      tagCount: tagRow?.count ?? 0,
    })

    if (errors !== true) {
      return NextResponse.json(
        { error: 'Product is not ready to publish', missing: errors },
        { status: 422 },
      )
    }
  }

  updateData.updatedAt = new Date()

  if (Object.keys(updateData).length <= 1) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  await db
    .update(Products)
    .set(updateData)
    .where(eq(Products.id, productId))

  // ── Category assignment ─────────────────────────────────────────────
  if ('categoryIds' in body && Array.isArray(body.categoryIds)) {
    const newCatIds: number[] = body.categoryIds.map(Number)
    await db.delete(ProductCategories).where(eq(ProductCategories.productId, productId))
    if (newCatIds.length > 0) {
      await db.insert(ProductCategories).values(
        newCatIds.map((categoryId) => ({ productId, categoryId }))
      )
    }
  }

  // ── Tag assignment ──────────────────────────────────────────────────
  if ('tagIds' in body && Array.isArray(body.tagIds)) {
    const newTagIds: number[] = body.tagIds.map(Number)
    await db.delete(ProductTags).where(eq(ProductTags.productId, productId))
    if (newTagIds.length > 0) {
      await db.insert(ProductTags).values(
        newTagIds.map((tagId) => ({ productId, tagId }))
      )
    }
  }

  const after = await db
    .select()
    .from(Products)
    .where(eq(Products.id, productId))
    .limit(1)

  await logAudit(ctx.userId, 'admin.product.updated', 'product', String(productId), before, after[0])

  // ── ISR revalidation ────────────────────────────────────────────────
  const slug = (updateData.slug as string) ?? before.slug
  revalidatePath(`/products/${slug}`)
  revalidatePath('/')

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
  const productId = parseInt(id, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Products)
    .where(eq(Products.id, productId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const before = rows[0]

  await db.delete(Products).where(eq(Products.id, productId))

  await logAudit(ctx.userId, 'admin.product.deleted', 'product', String(productId), before)

  // ISR: revalidate homepage since a product was removed
  revalidatePath('/')

  return NextResponse.json({ success: true })
}
