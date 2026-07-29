import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products, ProductCategories, ProductTags, ProductAssets, ProductAlternatives } from '@/app/db/schema'
import { eq, sql } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { validatePublishable } from '@/lib/validation/product'
import { validateContentBlocks } from '@/lib/validation/content-blocks'
import { validateForgeUrl, checkHomepage } from '@/lib/validation/submission'
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

  // Usable Today (staff attestation checkbox)
  if ('usableToday' in body) {
    updateData.usableToday = body.usableToday === true
  }

  // Review Flags (jsonb — automated validation flags)
  if ('reviewFlags' in body) {
    updateData.reviewFlags = Array.isArray(body.reviewFlags) ? body.reviewFlags : null
  }

  // Status
  const VALID_STATUSES = ['draft', 'scheduled', 'pending_review', 'published', 'rejected', 'delisted'] as const
  if ('status' in body && VALID_STATUSES.includes(body.status)) {
    updateData.status = body.status
  }

  // PublishAt (for scheduled products)
  if ('publishAt' in body) {
    updateData.publishAt = body.publishAt ? new Date(body.publishAt) : null
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

    // Forge URL validation (hard block)
    const githubUrl = (merged.githubUrl as string) ?? before.githubUrl
    const forgeResult = validateForgeUrl(githubUrl)
    if (!forgeResult.valid) {
      return NextResponse.json(
        { error: 'Repository validation failed', missing: [forgeResult.error!] },
        { status: 422 },
      )
    }

    // Homepage check (flag for review, don't block at API level but warn)
    const homepageUrl = (merged.homepageUrl as string) ?? before.homepageUrl
    const homepageResult = checkHomepage(homepageUrl)

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

    if (homepageResult.flagged) {
      // Log the flag for audit but don't block
      await logAudit(ctx.userId, 'product.review_flag', 'product', String(productId), null, { reason: homepageResult.reason })
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

  // ── Proprietary tool alternatives assignment ────────────────────────
  if ('proprietaryToolIds' in body && Array.isArray(body.proprietaryToolIds)) {
    const newToolIds: number[] = body.proprietaryToolIds.map(Number)
    await db.delete(ProductAlternatives).where(eq(ProductAlternatives.productId, productId))
    if (newToolIds.length > 0) {
      await db.insert(ProductAlternatives).values(
        newToolIds.map((proprietaryToolId) => ({ productId, proprietaryToolId }))
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
  revalidatePath(`/product/${slug}`)
  revalidatePath('/')

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
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

  // Delist instead of hard-delete for previously-published products
  if (before.status === 'published' || before.status === 'delisted') {
    let delistReason: string | null = null
    try {
      const body = await req.json()
      delistReason = typeof body.delistReason === 'string' ? body.delistReason : null
    } catch {
      // No body or invalid JSON — delistReason stays null
    }

    const now = new Date()
    await db
      .update(Products)
      .set({
        status: 'delisted',
        delistReason,
        delistedAt: before.delistedAt ?? now,
        updatedAt: now,
      })
      .where(eq(Products.id, productId))
    await logAudit(ctx.userId, 'admin.product.delisted', 'product', String(productId), before, { delistReason })
    revalidatePath(`/product/${before.slug}`)
    revalidatePath('/')
    revalidatePath('/graveyard')
  } else {
    await db.delete(Products).where(eq(Products.id, productId))
    await logAudit(ctx.userId, 'admin.product.deleted', 'product', String(productId), before)
    revalidatePath('/')
  }

  return NextResponse.json({ success: true })
}
