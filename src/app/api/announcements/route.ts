import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Announcements, Products, Organizations } from '@/app/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requirePermission } from '@/lib/auth'
import { createAnnouncementSchema, formatZodError } from '@/lib/validation'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productIdParam = searchParams.get('productId')

  if (productIdParam) {
    const productId = parseInt(productIdParam, 10)
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid productId' }, { status: 400 })
    }

    const rows = await db
      .select({
        id: Announcements.id,
        title: Announcements.title,
        body: Announcements.body,
        publishedAt: Announcements.publishedAt,
        createdAt: Announcements.createdAt,
      })
      .from(Announcements)
      .where(
        and(
          eq(Announcements.productId, productId),
          eq(Announcements.publishedAt, Announcements.publishedAt),
        ),
      )
      .orderBy(desc(Announcements.publishedAt))

    return NextResponse.json({ announcements: rows })
  }

  try {
    const ctx = await requirePermission('org:create_content')

    const orgRows = await db
      .select()
      .from(Organizations)
      .where(eq(Organizations.clerkOrgId, ctx.orgId))
      .limit(1)

    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const rows = await db
      .select({
        id: Announcements.id,
        title: Announcements.title,
        body: Announcements.body,
        publishedAt: Announcements.publishedAt,
        createdAt: Announcements.createdAt,
        productId: Announcements.productId,
        productName: Products.name,
      })
      .from(Announcements)
      .innerJoin(Products, eq(Announcements.productId, Products.id))
      .where(eq(Announcements.organizationId, orgRows[0].id))
      .orderBy(desc(Announcements.createdAt))

    return NextResponse.json({ announcements: rows })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requirePermission('org:publish_content')

    const raw = await req.json()
    const parsed = createAnnouncementSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    const { productId, title, body } = parsed.data

    const orgRows = await db
      .select()
      .from(Organizations)
      .where(eq(Organizations.clerkOrgId, ctx.orgId))
      .limit(1)

    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const productRows = await db
      .select()
      .from(Products)
      .where(
        and(
          eq(Products.id, productId),
          eq(Products.claimedByOrgId, orgRows[0].id),
        ),
      )
      .limit(1)

    if (productRows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found or not claimed by your organization' },
        { status: 404 },
      )
    }

    const [announcement] = await db
      .insert(Announcements)
      .values({
        productId,
        organizationId: orgRows[0].id,
        title,
        body,
        publishedAt: new Date(),
      })
      .returning()

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.name === 'AuthError') {
      return NextResponse.json({ error: e.message }, { status: 401 })
    }
    throw e
  }
}
