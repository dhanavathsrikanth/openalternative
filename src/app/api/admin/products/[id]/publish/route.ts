import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products, ProductCategories, ProductTags, ProductAssets } from '@/app/db/schema'
import { eq, sql } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { validatePublishable } from '@/lib/validation/product'
import { revalidatePath } from 'next/cache'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * PATCH /api/admin/products/[id]/publish
 *
 * Quick publish/unpublish toggle. When publishing, runs the full
 * validation gate and returns specific missing-field errors.
 * Revalidates ISR paths on status change.
 */
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

  const body = await req.json().catch(() => ({}))
  const newStatus = body.status as string
  if (newStatus !== 'draft' && newStatus !== 'published') {
    return NextResponse.json({ error: 'status must be "draft" or "published"' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Products)
    .where(eq(Products.id, productId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  const product = rows[0]

  // ── Publish gate: only when promoting to published ──────────────────
  if (newStatus === 'published') {
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
      name: product.name,
      slug: product.slug,
      tagline: product.tagline,
      description: product.description,
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

  await db
    .update(Products)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(Products.id, productId))

  await logAudit(ctx.userId, `admin.product.${newStatus === 'published' ? 'published' : 'unpublished'}`, 'product', String(productId))

  // ── ISR revalidation ────────────────────────────────────────────────
  revalidatePath(`/products/${product.slug}`)
  revalidatePath('/')
  // Revalidate the category pages this product belongs to
  const catRows = await db
    .select({ slug: sql<string>`(SELECT slug FROM categories WHERE id = ${ProductCategories.categoryId})` })
    .from(ProductCategories)
    .where(eq(ProductCategories.productId, productId))
  for (const row of catRows) {
    if (row.slug) revalidatePath(`/categories/${row.slug}`)
  }

  return NextResponse.json({ success: true, status: newStatus })
}
