import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { AuditLogs } from '@/app/db/schema'
import { eq, and, desc, count, sql } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const action = searchParams.get('action')
  const entityType = searchParams.get('entityType')
  const actorId = searchParams.get('actorId')

  const conditions = []
  if (action) conditions.push(eq(AuditLogs.action, action))
  if (entityType) conditions.push(eq(AuditLogs.entityType, entityType))
  if (actorId) conditions.push(eq(AuditLogs.actorId, actorId))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [totalRow] = await db
    .select({ value: count() })
    .from(AuditLogs)
    .where(whereClause)

  const total = Number(totalRow?.value ?? 0)

  const data = await db
    .select()
    .from(AuditLogs)
    .where(whereClause)
    .orderBy(desc(AuditLogs.createdAt))
    .offset((page - 1) * limit)
    .limit(limit)

  return NextResponse.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}
