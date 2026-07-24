import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Contributions, Contributors, Products } from '@/app/db/schema'
import { eq, sql } from 'drizzle-orm'
import { requireStaff } from '@/lib/auth'
import { withAudit } from '@/lib/audit'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const contributionId = parseInt(id, 10)
  if (isNaN(contributionId)) {
    return NextResponse.json({ error: 'Invalid contribution ID' }, { status: 400 })
  }

  const body = await req.json()
  const { status } = body

  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json({ error: 'status must be "approved" or "rejected"' }, { status: 400 })
  }

  const rows = await db
    .select()
    .from(Contributions)
    .where(eq(Contributions.id, contributionId))
    .limit(1)

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Contribution not found' }, { status: 404 })
  }

  const contribution = rows[0]

  if (contribution.status !== 'pending') {
    return NextResponse.json({ error: 'Contribution already processed' }, { status: 400 })
  }

  await withAudit(
    ctx.userId,
    `contribution.${status}`,
    'contribution',
    String(contributionId),
    async () => ({ ...contribution }),
    async (tx) => {
      await tx
        .update(Contributions)
        .set({ status })
        .where(eq(Contributions.id, contributionId))

      if (status === 'approved') {
        const changes = (typeof contribution.changes === 'object' && contribution.changes !== null
          ? contribution.changes
          : []) as { field: string; value: string }[]

        const updateData: Record<string, string> = {}
        for (const change of changes) {
          if (['description', 'license', 'homepageUrl', 'primaryLanguage'].includes(change.field)) {
            updateData[change.field] = change.value
          }
        }

        if (Object.keys(updateData).length > 0) {
          await tx
            .update(Products)
            .set({ ...updateData, updatedAt: new Date() })
            .where(eq(Products.id, contribution.productId))
        }

        await tx
          .update(Contributors)
          .set({
            reputationPoints: sql`${Contributors.reputationPoints} + 5`,
          })
          .where(eq(Contributors.id, contribution.contributorId))
      }
    },
  )

  return NextResponse.json({ message: `Contribution ${status}` })
}
