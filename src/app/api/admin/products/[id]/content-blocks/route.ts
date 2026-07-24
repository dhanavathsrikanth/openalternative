import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'
import { validateContentBlocks } from '@/lib/validation/content-blocks'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const productId = parseInt(id, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
  }

  const rows = await db
    .select({ contentBlocks: Products.contentBlocks })
    .from(Products)
    .where(eq(Products.id, productId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json({ contentBlocks: rows[0].contentBlocks ?? null })
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const productId = parseInt(id, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
  }

  const body = await req.json()
  const { contentBlocks } = body as { contentBlocks: unknown }

  if (contentBlocks != null) {
    const validation = validateContentBlocks(contentBlocks)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid content blocks', details: validation.errors },
        { status: 422 },
      )
    }
  }

  const rows = await db
    .update(Products)
    .set({
      contentBlocks,
      contentUpdatedAt: new Date(),
    })
    .where(eq(Products.id, productId))
    .returning({ id: Products.id })

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, productId: rows[0].id })
}
