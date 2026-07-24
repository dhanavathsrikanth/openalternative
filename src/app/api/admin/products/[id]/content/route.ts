import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { ProductContent } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'

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

  const content = await db
    .select()
    .from(ProductContent)
    .where(eq(ProductContent.productId, productId))

  return NextResponse.json({ content })
}
