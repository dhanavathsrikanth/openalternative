import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products, ProductCategories, ProductTags, ProductAlternatives } from '@/app/db/schema'
import { eq, sql } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { toSlug } from '@/lib/normalize/canonicalResolver'
import { validateContentBlocks } from '@/lib/validation/content-blocks'
import { validateForgeUrl } from '@/lib/validation/submission'

export async function POST(req: NextRequest) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))

  const name = (body.name as string)?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const description = (body.description as string)?.trim() ?? ''
  const tagline = (body.tagline as string)?.trim() ?? null

  // Generate slug from name, or use a custom slug if provided
  let slug = (body.slug as string)?.trim()
  if (slug) {
    slug = toSlug(slug)
  } else {
    slug = toSlug(name)
  }

  if (!slug) {
    return NextResponse.json({ error: 'Could not generate a valid slug' }, { status: 400 })
  }

  // Ensure slug is unique — append a suffix if needed
  let finalSlug = slug
  let suffix = 2
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db
      .select({ id: Products.id })
      .from(Products)
      .where(eq(Products.slug, finalSlug))
      .limit(1)

    if (existing.length === 0) break
    finalSlug = `${slug}-${suffix}`
    suffix++
  }

  const githubUrl = (body.githubUrl as string)?.trim() || null
  const homepageUrl = (body.homepageUrl as string)?.trim() || null
  const docsUrl = (body.docsUrl as string)?.trim() || null
  const changelogUrl = (body.changelogUrl as string)?.trim() || null
  const communityUrl = (body.communityUrl as string)?.trim() || null
  const license = (body.license as string)?.trim() || null
  const primaryLanguage = (body.primaryLanguage as string)?.trim() || null
  const faq = body.faq ?? null
  const seoTitle = (body.seoTitle as string)?.trim() || null
  const seoDescription = (body.seoDescription as string)?.trim() || null
  const seoCanonicalUrl = (body.seoCanonicalUrl as string)?.trim() || null
  const contentBlocks = body.contentBlocks ?? null

  if (contentBlocks != null) {
    const validation = validateContentBlocks(contentBlocks)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid content blocks', details: validation.errors },
        { status: 422 },
      )
    }
  }

  // Forge URL validation (soft — warn but don't block admin creation)
  if (githubUrl) {
    const forgeResult = validateForgeUrl(githubUrl)
    if (!forgeResult.valid) {
      return NextResponse.json(
        { error: forgeResult.error },
        { status: 422 },
      )
    }
  }

  const [product] = await db
    .insert(Products)
    .values({
      name,
      slug: finalSlug,
      description,
      tagline,
      license,
      primaryLanguage,
      githubUrl,
      homepageUrl,
      docsUrl,
      changelogUrl,
      communityUrl,
      faq,
      seoTitle,
      seoDescription,
      seoCanonicalUrl,
      contentBlocks,
      status: 'draft',
    })
    .returning()

  // Category assignment
  const categoryIds: number[] = Array.isArray(body.categoryIds) ? body.categoryIds.map(Number) : []
  if (categoryIds.length > 0) {
    await db.insert(ProductCategories).values(
      categoryIds.map((categoryId) => ({ productId: product.id, categoryId }))
    )
  }

  // Tag assignment
  const tagIds: number[] = Array.isArray(body.tagIds) ? body.tagIds.map(Number) : []
  if (tagIds.length > 0) {
    await db.insert(ProductTags).values(
      tagIds.map((tagId) => ({ productId: product.id, tagId }))
    )
  }

  // Proprietary tool alternatives assignment
  const proprietaryToolIds: number[] = Array.isArray(body.proprietaryToolIds) ? body.proprietaryToolIds.map(Number) : []
  if (proprietaryToolIds.length > 0) {
    await db.insert(ProductAlternatives).values(
      proprietaryToolIds.map((proprietaryToolId) => ({ productId: product.id, proprietaryToolId }))
    )
  }

  await logAudit(ctx.userId, 'admin.product.created', 'product', String(product.id))

  return NextResponse.json({ success: true, product: { id: product.id, slug: product.slug } })
}
