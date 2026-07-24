import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/app/db'
import { Reviews, Contributors } from '@/app/db/schema'
import { and, eq } from 'drizzle-orm'
import { getPostHogClient } from '@/lib/posthog-server'
import { createReviewSchema, getReviewsSchema, formatZodError } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Sign in required to leave a review' }, { status: 401 })
  }

  const contributorRows = await db
    .select()
    .from(Contributors)
    .where(eq(Contributors.clerkUserId, userId))
    .limit(1)

  if (contributorRows.length === 0) {
    return NextResponse.json({ error: 'Contributor profile not found' }, { status: 404 })
  }

  const contributor = contributorRows[0]

  const raw = await req.json()
  const parsed = createReviewSchema.safeParse(raw)

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  const { productId, rating, reviewBody } = parsed.data

  const existing = await db
    .select()
    .from(Reviews)
    .where(
      and(
        eq(Reviews.productId, productId),
        eq(Reviews.contributorId, contributor.id),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'You have already reviewed this product. Edit your existing review instead.' },
      { status: 409 },
    )
  }

  const [review] = await db
    .insert(Reviews)
    .values({
      productId,
      contributorId: contributor.id,
      rating: Math.round(rating),
      body: reviewBody.trim(),
    })
    .returning()

  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: userId,
    event: 'review_created',
    properties: {
      product_id: productId,
      rating: Math.round(rating),
    },
  })
  await posthog.flush()

  return NextResponse.json({ review }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raw = { productId: searchParams.get('productId') ?? '' }

  if (!raw.productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

  const parsed = getReviewsSchema.safeParse(raw)

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  const productId = parseInt(parsed.data.productId, 10)

  const reviews = await db
    .select({
      id: Reviews.id,
      rating: Reviews.rating,
      body: Reviews.body,
      createdAt: Reviews.createdAt,
      contributorName: Contributors.displayName,
    })
    .from(Reviews)
    .leftJoin(Contributors, eq(Reviews.contributorId, Contributors.id))
    .where(eq(Reviews.productId, productId))

  return NextResponse.json({ reviews })
}
