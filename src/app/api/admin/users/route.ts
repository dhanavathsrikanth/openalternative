import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Users } from '@/app/db/schema'
import { desc, eq, ilike, sql } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
  const search = searchParams.get('search')?.trim() || ''
  const offset = (page - 1) * limit

  const where = search ? ilike(Users.id, `%${search}%`) : undefined

  const [[{ total }], users] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(Users).where(where),
    db
      .select()
      .from(Users)
      .where(where)
      .orderBy(desc(Users.createTs))
      .offset(offset)
      .limit(limit),
  ])

  return NextResponse.json({
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  })
}

export async function PATCH(req: NextRequest) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { userId, staff } = body

  if (!userId || typeof staff !== 'boolean') {
    return NextResponse.json(
      { error: 'userId (string) and staff (boolean) are required' },
      { status: 400 },
    )
  }

  const rows = await db.select().from(Users).where(eq(Users.id, userId)).limit(1)
  if (rows.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const before = rows[0]
  await db.update(Users).set({ staff }).where(eq(Users.id, userId))
  const after = { ...before, staff }

  await logAudit(ctx.userId, 'admin.user.staff_toggled', 'user', userId, before, after)

  return NextResponse.json({ success: true, userId, staff })
}
