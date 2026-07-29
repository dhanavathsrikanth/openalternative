import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { ProprietaryTools } from '@/app/db/schema'
import { eq, ilike } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'
import { toSlug } from '@/lib/normalize/canonicalResolver'

/**
 * GET /api/admin/proprietary-tools — List all proprietary tools.
 * Optional query: ?q=search term for filtering by name
 */
export async function GET(req: NextRequest) {
  try {
    await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')

  const rows = q
    ? await db
        .select()
        .from(ProprietaryTools)
        .where(ilike(ProprietaryTools.name, `%${q}%`))
        .orderBy(ProprietaryTools.name)
    : await db.select().from(ProprietaryTools).orderBy(ProprietaryTools.name)

  return NextResponse.json({ tools: rows })
}

/**
 * POST /api/admin/proprietary-tools — Create a new proprietary tool.
 * Body: { name: string, url?: string }
 */
export async function POST(req: NextRequest) {
  try {
    await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const name = (body.name as string)?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const url = (body.url as string)?.trim() || null

  // Check for duplicate name
  const existing = await db
    .select({ id: ProprietaryTools.id })
    .from(ProprietaryTools)
    .where(ilike(ProprietaryTools.name, name))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ error: 'A tool with this name already exists', id: existing[0].id }, { status: 409 })
  }

  const slug = toSlug(name)

  // Check for duplicate slug
  const existingSlug = await db
    .select({ id: ProprietaryTools.id })
    .from(ProprietaryTools)
    .where(eq(ProprietaryTools.slug, slug))
    .limit(1)

  if (existingSlug.length > 0) {
    return NextResponse.json({ error: 'A tool with this slug already exists', id: existingSlug[0].id }, { status: 409 })
  }

  const [tool] = await db
    .insert(ProprietaryTools)
    .values({ name, slug, url })
    .returning()

  return NextResponse.json({ tool })
}
