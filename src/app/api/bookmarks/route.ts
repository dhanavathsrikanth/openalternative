import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/app/db'
import { Bookmarks, Products, ProductAssets } from '@/app/db/schema'
import { and, eq, desc } from 'drizzle-orm'

/**
 * POST /api/bookmarks — Toggle a bookmark for the current user.
 * Body: { productId: number }
 * Returns: { bookmarked: boolean }
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required to bookmark products' }, { status: 401 })
  }

  const body = await req.json()
  const productId = Number(body.productId)
  if (!productId || !Number.isInteger(productId)) {
    return NextResponse.json({ error: 'Valid productId is required' }, { status: 400 })
  }

  // Check product exists
  const productRows = await db
    .select({ id: Products.id })
    .from(Products)
    .where(eq(Products.id, productId))
    .limit(1)
  if (productRows.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Check if bookmark already exists
  const existing = await db
    .select()
    .from(Bookmarks)
    .where(and(eq(Bookmarks.userId, userId), eq(Bookmarks.productId, productId)))
    .limit(1)

  if (existing.length > 0) {
    // Remove bookmark
    await db
      .delete(Bookmarks)
      .where(and(eq(Bookmarks.userId, userId), eq(Bookmarks.productId, productId)))
    return NextResponse.json({ bookmarked: false })
  }

  // Add bookmark
  await db.insert(Bookmarks).values({ userId, productId })
  return NextResponse.json({ bookmarked: true })
}

/**
 * GET /api/bookmarks — List the current user's bookmarks.
 * Optional query param: ?productId=X to check a single product's bookmark status.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ bookmarks: [], bookmarked: false })
  }

  const { searchParams } = new URL(req.url)
  const productIdParam = searchParams.get('productId')

  // Single product check
  if (productIdParam) {
    const productId = Number(productIdParam)
    if (productId && Number.isInteger(productId)) {
      const existing = await db
        .select()
        .from(Bookmarks)
        .where(and(eq(Bookmarks.userId, userId), eq(Bookmarks.productId, productId)))
        .limit(1)
      return NextResponse.json({ bookmarked: existing.length > 0 })
    }
  }

  // List all user bookmarks with product + logo data
  const rows = await db
    .select({
      productId: Bookmarks.productId,
      createdAt: Bookmarks.createdAt,
      name: Products.name,
      slug: Products.slug,
      description: Products.description,
      tagline: Products.tagline,
      license: Products.license,
      primaryLanguage: Products.primaryLanguage,
      stars: Products.stars,
      forks: Products.forks,
      confidenceScore: Products.confidenceScore,
      logoUrl: ProductAssets.url,
    })
    .from(Bookmarks)
    .innerJoin(Products, eq(Bookmarks.productId, Products.id))
    .leftJoin(ProductAssets, and(eq(ProductAssets.productId, Products.id), eq(ProductAssets.type, 'logo')))
    .where(eq(Bookmarks.userId, userId))
    .orderBy(desc(Bookmarks.createdAt))

  return NextResponse.json({ bookmarks: rows })
}
