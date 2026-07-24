import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Tags } from '@/app/db/schema'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET() {
  try {
    await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tags = await db.select().from(Tags)
  return NextResponse.json(tags)
}

export async function POST(req: NextRequest) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, slug } = body

  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 })
  }

  const [tag] = await db
    .insert(Tags)
    .values({ name, slug })
    .returning()

  await logAudit(ctx.userId, 'admin.tag.created', 'tag', String(tag.id), null, tag)

  return NextResponse.json(tag, { status: 201 })
}
