import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Collections } from '@/app/db/schema'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const collections = await db.select().from(Collections)
  return NextResponse.json(collections)
}

export async function POST(req: NextRequest) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, slug, description, curationType } = body

  if (!title || !slug) {
    return NextResponse.json({ error: 'title and slug are required' }, { status: 400 })
  }

  const [collection] = await db
    .insert(Collections)
    .values({ title, slug, description, curationType })
    .returning()

  await logAudit(ctx.userId, 'admin.collection.created', 'collection', String(collection.id), null, collection)

  return NextResponse.json(collection, { status: 201 })
}
