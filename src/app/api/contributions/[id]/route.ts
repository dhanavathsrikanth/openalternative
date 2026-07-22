import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Contributions, Contributors, Products } from '@/app/db/schema'
import { eq, sql } from 'drizzle-orm'
import { verifySecret } from '@/lib/cron-auth'

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  // Basic auth check for moderation endpoints
  if (!verifySecret(req)) {
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
    return NextResponse.json({ error: 'Status must be "approved" or "rejected"' }, { status: 400 })
  }

  // Find contribution
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

  // Update status
  await db
    .update(Contributions)
    .set({ status })
    .where(eq(Contributions.id, contributionId))

  if (status === 'approved') {
    // Apply changes to product
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
      await db
        .update(Products)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(Products.id, contribution.productId))
    }

    // Increment contributor reputation
    await db
      .update(Contributors)
      .set({
        reputationPoints: sql`${Contributors.reputationPoints} + 5`,
      })
      .where(eq(Contributors.id, contribution.contributorId))
  }

  return NextResponse.json({ message: `Contribution ${status}` })
}
