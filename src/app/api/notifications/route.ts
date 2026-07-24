import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Notifications, Organizations } from '@/app/db/schema'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireSession()

    const orgRows = await db
      .select()
      .from(Organizations)
      .where(eq(Organizations.clerkOrgId, ctx.orgId))
      .limit(1)

    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const rows = await db
      .select()
      .from(Notifications)
      .where(
        and(
          eq(Notifications.organizationId, orgRows[0].id),
          eq(Notifications.recipientId, ctx.userId),
        ),
      )
      .orderBy(desc(Notifications.createdAt))
      .limit(50)

    const unreadCount = rows.filter((r) => r.readAt === null).length

    return NextResponse.json({ notifications: rows, unreadCount })
  } catch (e) {
    if (e instanceof Error && e.name === 'AuthError') {
      return NextResponse.json({ error: e.message }, { status: 401 })
    }
    throw e
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSession()
    const body = await req.json()

    const { notificationId } = body as { notificationId?: number }
    if (!notificationId) {
      return NextResponse.json({ error: 'notificationId required' }, { status: 400 })
    }

    const orgRows = await db
      .select()
      .from(Organizations)
      .where(eq(Organizations.clerkOrgId, ctx.orgId))
      .limit(1)

    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    await db
      .update(Notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(Notifications.id, notificationId),
          eq(Notifications.organizationId, orgRows[0].id),
          eq(Notifications.recipientId, ctx.userId),
        ),
      )

    return NextResponse.json({ ok: true })
  } catch (e) {
    if (e instanceof Error && e.name === 'AuthError') {
      return NextResponse.json({ error: e.message }, { status: 401 })
    }
    throw e
  }
}
