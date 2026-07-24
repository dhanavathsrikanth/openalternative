import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Reports, Products } from '@/app/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'

const PAGE_SIZE = 50

export async function GET(req: NextRequest) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const status = searchParams.get('status') ?? ''
  const productId = searchParams.get('productId') ?? ''

  const conditions = []
  if (status) conditions.push(eq(Reports.status, status as 'pending' | 'resolved' | 'dismissed'))
  if (productId) conditions.push(eq(Reports.productId, Number(productId)))

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [[{ total }], reports] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(Reports)
      .where(where),
    db
      .select({
        id: Reports.id,
        productId: Reports.productId,
        reason: Reports.reason,
        detail: Reports.detail,
        reporterId: Reports.reporterId,
        status: Reports.status,
        createdAt: Reports.createdAt,
        productName: Products.name,
        productSlug: Products.slug,
      })
      .from(Reports)
      .leftJoin(Products, eq(Reports.productId, Products.id))
      .where(where)
      .orderBy(desc(Reports.createdAt))
      .offset((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return NextResponse.json({
    reports,
    total,
    page,
    totalPages,
  })
}