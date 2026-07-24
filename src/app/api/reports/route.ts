import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Reports, Contributors, Products } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { auth } from '@clerk/nextjs/server'
import { getPostHogClient } from '@/lib/posthog-server'
import { createReportSchema, formatZodError } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const raw = await req.json()
  const parsed = createReportSchema.safeParse(raw)

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  const { productId, reason, detail } = parsed.data

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

  // Create report
  const [report] = await db
    .insert(Reports)
    .values({
      productId,
      reason,
      detail: detail?.trim() || null,
      reporterId: contributor.id,
      status: 'pending',
    })
    .returning()

  const posthog = getPostHogClient()

  posthog.capture({
    distinctId: userId,
    event: 'report_submitted',
    properties: {
      product_id: productId,
      report_id: report.id,
      reason,
      has_detail: Boolean(detail),
    },
  })

  await posthog.flush()

  return NextResponse.json({
    message: 'Report submitted',
    reportId: report.id,
  })
}