import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Categories } from '@/app/db/schema'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const categories = await db.select().from(Categories)
  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, slug, description, seoTitle, seoDescription, seoCanonicalUrl } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  }

  const [category] = await db
    .insert(Categories)
    .values({ name, slug, description, seoTitle, seoDescription, seoCanonicalUrl })
    .returning()

  await logAudit(ctx.userId, 'admin.category.created', 'category', String(category.id), null, category)

  return NextResponse.json(category, { status: 201 })
}
