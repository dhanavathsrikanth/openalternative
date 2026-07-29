import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products, ProductCategories, ProductTags } from '@/app/db/schema'
import { eq, sql } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { toSlug } from '@/lib/normalize/canonicalResolver'
import { validateSubmission, type SubmissionInput } from '@/lib/validation/submission'
import { logAudit } from '@/lib/audit'

/**
 * POST /api/submit
 *
 * Public endpoint for product submissions. Requires Clerk authentication.
 * Creates a product in `pending_review` status with review flags stored
 * for admin evaluation.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session.userId) {
    return NextResponse.json({ error: 'You must be signed in to submit a product.' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))

  const input: SubmissionInput = {
    name: (body.name as string)?.trim() ?? '',
    tagline: (body.tagline as string)?.trim() ?? '',
    description: (body.description as string)?.trim() ?? '',
    githubUrl: (body.githubUrl as string)?.trim() ?? '',
    homepageUrl: (body.homepageUrl as string)?.trim() || undefined,
    license: (body.license as string)?.trim() ?? '',
    primaryLanguage: (body.primaryLanguage as string)?.trim() || undefined,
    categoryIds: Array.isArray(body.categoryIds) ? body.categoryIds.map(Number) : [],
    tagIds: Array.isArray(body.tagIds) ? body.tagIds.map(Number) : [],
  }

  // Run all validation checks
  const validation = validateSubmission(input)
  if (!validation.ok) {
    return NextResponse.json(
      { error: 'Submission has validation errors', details: validation.errors },
      { status: 422 },
    )
  }

  // Generate unique slug
  let slug = toSlug(input.name)
  if (!slug) {
    return NextResponse.json({ error: 'Could not generate a valid slug' }, { status: 400 })
  }

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

  // Create product as pending_review
  const [product] = await db
    .insert(Products)
    .values({
      name: input.name,
      slug: finalSlug,
      description: input.description,
      tagline: input.tagline,
      license: input.license,
      primaryLanguage: input.primaryLanguage || null,
      githubUrl: input.githubUrl,
      homepageUrl: input.homepageUrl || null,
      status: 'pending_review',
      reviewFlags: validation.reviewFlags.length > 0 ? validation.reviewFlags : null,
    })
    .returning()

  // Category assignment
  if (input.categoryIds.length > 0) {
    await db.insert(ProductCategories).values(
      input.categoryIds.map((categoryId) => ({ productId: product.id, categoryId }))
    )
  }

  // Tag assignment
  if (input.tagIds.length > 0) {
    await db.insert(ProductTags).values(
      input.tagIds.map((tagId) => ({ productId: product.id, tagId }))
    )
  }

  await logAudit(session.userId, 'product.submitted', 'product', String(product.id), null, {
    slug: product.slug,
    name: product.name,
    submittedBy: session.userId,
    reviewFlags: validation.reviewFlags,
  })

  return NextResponse.json({
    success: true,
    product: { id: product.id, slug: product.slug },
    reviewFlags: validation.reviewFlags,
  })
}
