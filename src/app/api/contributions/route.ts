import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Contributions, Contributors, Products } from '@/app/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { getPostHogClient } from '@/lib/posthog-server'

const AUTO_APPROVE_THRESHOLD = parseInt(process.env.CONTRIBUTOR_AUTO_APPROVE_THRESHOLD ?? '50', 10)

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await req.json()
  const { productId, changes, sourceUrl } = body

  if (!productId || !changes || !sourceUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate source URL
  try {
    new URL(sourceUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid source URL' }, { status: 400 })
  }

  // Find or create contributor
  let contributorRows = await db
    .select()
    .from(Contributors)
    .where(eq(Contributors.clerkUserId, userId))
    .limit(1)

  if (contributorRows.length === 0) {
    const [newContributor] = await db
      .insert(Contributors)
      .values({
        clerkUserId: userId,
        email: `${userId}@placeholder.local`,
        displayName: 'Contributor',
      })
      .returning()
    contributorRows = [newContributor]
  }

  const contributor = contributorRows[0]

  // Check if product exists
  const productRows = await db
    .select({ id: Products.id })
    .from(Products)
    .where(eq(Products.id, productId))
    .limit(1)

  if (productRows.length === 0) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Auto-approve if contributor has enough reputation
  const status = contributor.reputationPoints >= AUTO_APPROVE_THRESHOLD ? 'approved' : 'pending'

  // Prevent duplicate pending contributions from the same contributor on the same product
  if (status === 'pending') {
    const existingPending = await db
      .select()
      .from(Contributions)
      .where(
        and(
          eq(Contributions.productId, productId),
          eq(Contributions.contributorId, contributor.id),
          eq(Contributions.status, 'pending'),
        ),
      )
      .limit(1)

    if (existingPending.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending suggestion for this product. Wait for it to be reviewed before submitting another.' },
        { status: 409 },
      )
    }
  }

  // Create contribution
  const [contribution] = await db
    .insert(Contributions)
    .values({
      productId,
      contributorId: contributor.id,
      changes,
      sourceUrl,
      status,
    })
    .returning()

  const posthog = getPostHogClient()

  // If auto-approved, apply changes immediately
  if (status === 'approved') {
    await applyChanges(productId, changes)
    await db
      .update(Contributors)
      .set({ reputationPoints: contributor.reputationPoints + 5 })
      .where(eq(Contributors.id, contributor.id))
    posthog.capture({
      distinctId: userId,
      event: 'contribution_auto_approved',
      properties: {
        product_id: productId,
        contribution_id: contribution.id,
        fields_changed: (changes as { field: string; value: string }[]).map((c) => c.field),
      },
    })
  } else {
    posthog.capture({
      distinctId: userId,
      event: 'contribution_submitted',
      properties: {
        product_id: productId,
        contribution_id: contribution.id,
        fields_changed: (changes as { field: string; value: string }[]).map((c) => c.field),
      },
    })
  }
  await posthog.flush()

  return NextResponse.json({
    message: status === 'approved' ? 'Changes applied automatically' : 'Submitted for review',
    contributionId: contribution.id,
    status,
  })
}

async function applyChanges(productId: number, changes: { field: string; value: string }[]) {
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
      .where(eq(Products.id, productId))
  }
}
