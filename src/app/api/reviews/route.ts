import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/app/db'
import { Reviews, Contributors } from '@/app/db/schema'
import { and, eq } from 'drizzle-orm'

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

  const body = await req.json()
  const { productId, rating, reviewBody } = body as {
    productId: number
    rating: number
    reviewBody: string
  }

  if (!productId || !rating || !reviewBody) {
    return NextResponse.json({ error: 'productId, rating, and reviewBody are required' }, { status: 400 })
  }

  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }

  if (reviewBody.trim().length < 10) {
    return NextResponse.json({ error: 'Review must be at least 10 characters' }, { status: 400 })
  }

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

  return NextResponse.json({ review }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')

  if (!productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 })
  }

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
    .where(eq(Reviews.productId, parseInt(productId)))

  return NextResponse.json({ reviews })
}
