import { NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products, ClaimRequests } from '@/app/db/schema'
import { requireSession } from '@/lib/auth'
import { withAudit } from '@/lib/audit'
import { initiateClaimSchema, formatZodError } from '@/lib/validation'
import { eq, and } from 'drizzle-orm'
import crypto from 'crypto'

export async function POST(req: Request): Promise<NextResponse> {
  let ctx
  try {
    ctx = await requireSession()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const parsed = initiateClaimSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  const { productId, method } = parsed.data

  // Look up product
  const productRows = await db
    .select()
    .from(Products)
    .where(eq(Products.id, productId))
    .limit(1)

  if (productRows.length === 0) {
    return NextResponse.json({ error: 'product not found' }, { status: 404 })
  }

  const product = productRows[0]

  // Check if product has the required URL for the chosen method
  if (method === 'dns_txt' && !product.homepageUrl) {
    return NextResponse.json(
      { error: 'This product has no homepage URL — DNS verification is not possible.' },
      { status: 422 }
    )
  }
  if (method === 'github_org' && !product.githubUrl) {
    return NextResponse.json(
      { error: 'This product has no GitHub URL — GitHub org verification is not possible.' },
      { status: 422 }
    )
  }

  // Check if already claimed by a different org
  if (product.claimedByOrgId !== null && product.claimedByOrgId !== undefined) {
    if (product.claimedByOrgId !== parseInt(ctx.orgId)) {
      return NextResponse.json(
        {
          error: 'already_claimed',
          message: 'This product has already been claimed by another organization. Please contact support.',
        },
        { status: 409 }
      )
    }
    // Already claimed by this org — return the existing claim info
    return NextResponse.json(
      { message: 'This product is already claimed by your organization.' },
      { status: 200 }
    )
  }

  // Look up the internal org id from the clerk org id
  const { Organizations } = await import('@/app/db/schema')
  const orgRows = await db
    .select()
    .from(Organizations)
    .where(eq(Organizations.clerkOrgId, ctx.orgId))
    .limit(1)

  if (orgRows.length === 0) {
    return NextResponse.json({ error: 'organization not found' }, { status: 404 })
  }

  const orgId = orgRows[0].id

  // Check for an existing pending claim for this product + org
  const existingPending = await db
    .select()
    .from(ClaimRequests)
    .where(
      and(
        eq(ClaimRequests.productId, productId),
        eq(ClaimRequests.organizationId, orgId),
        eq(ClaimRequests.status, 'pending')
      )
    )
    .limit(1)

  if (existingPending.length > 0) {
    return NextResponse.json(
      {
        message: 'You already have a pending claim for this product.',
        claimRequestId: existingPending[0].id,
        verificationToken: existingPending[0].verificationToken,
      },
      { status: 200 }
    )
  }

  const verificationToken = crypto.randomBytes(32).toString('hex')

  const inserted = await withAudit(
    ctx.userId,
    'claim.initiated',
    'claim_request',
    `${productId}`,
    async () => null,
    async (tx) => {
      return tx
        .insert(ClaimRequests)
        .values({
          productId,
          organizationId: orgId,
          method,
          verificationToken,
        })
        .returning({ id: ClaimRequests.id })
    },
  )

  return NextResponse.json(
    {
      message: 'Claim initiated. Follow the instructions to verify.',
      claimRequestId: inserted[0].id,
      verificationToken,
      method,
    },
    { status: 201 }
  )
}
