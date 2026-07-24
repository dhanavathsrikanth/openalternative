import { NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products, ClaimRequests, Organizations } from '@/app/db/schema'
import { requireSession } from '@/lib/auth'
import { withAudit } from '@/lib/audit'
import { verifyClaimSchema, formatZodError } from '@/lib/validation'
import { eq, and, isNull } from 'drizzle-orm'
import { verifyProductDns } from '@/lib/verify-dns'
import { verifyGithubMembership } from '@/lib/verify-github'
import { createNotification } from '@/lib/notifications'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: RouteContext): Promise<NextResponse> {
  let ctx
  try {
    ctx = await requireSession()
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { id: idParam } = await params

  const parsed = verifyClaimSchema.safeParse({ claimRequestId: parseInt(idParam) })
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  const claimRequestId = parsed.data.claimRequestId

  const claimRows = await db
    .select()
    .from(ClaimRequests)
    .where(eq(ClaimRequests.id, claimRequestId))
    .limit(1)

  if (claimRows.length === 0) {
    return NextResponse.json({ error: 'claim request not found' }, { status: 404 })
  }

  const claim = claimRows[0]

  if (claim.status !== 'pending') {
    return NextResponse.json(
      { error: `This claim is already ${claim.status}.` },
      { status: 409 }
    )
  }

  const orgRows = await db
    .select()
    .from(Organizations)
    .where(eq(Organizations.id, claim.organizationId))
    .limit(1)

  if (orgRows.length === 0 || orgRows[0].clerkOrgId !== ctx.orgId) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const productRows = await db
    .select()
    .from(Products)
    .where(eq(Products.id, claim.productId))
    .limit(1)

  if (productRows.length === 0) {
    return NextResponse.json({ error: 'product not found' }, { status: 404 })
  }

  const product = productRows[0]

  if (product.claimedByOrgId !== null && product.claimedByOrgId !== undefined) {
    if (product.claimedByOrgId !== claim.organizationId) {
      return NextResponse.json(
        {
          error: 'already_claimed',
          message: 'This product has already been claimed by another organization.',
        },
        { status: 409 }
      )
    }
    return NextResponse.json({ message: 'Already claimed.' }, { status: 200 })
  }

  let verified = false

  if (claim.method === 'dns_txt') {
    if (!product.homepageUrl) {
      return NextResponse.json(
        { error: 'Product has no homepage URL.' },
        { status: 422 }
      )
    }
    const result = await verifyProductDns(product.homepageUrl, claim.verificationToken)
    verified = result.verified
  } else if (claim.method === 'github_org') {
    if (!product.githubUrl) {
      return NextResponse.json(
        { error: 'Product has no GitHub URL.' },
        { status: 422 }
      )
    }
    const result = await verifyGithubMembership(
      product.githubUrl,
      ctx.userId,
      process.env.GITHUB_TOKEN
    )
    verified = result.verified
  }

  const newStatus = verified ? 'verified' as const : 'failed' as const

  if (!verified) {
    await db
      .update(ClaimRequests)
      .set({ status: newStatus })
      .where(eq(ClaimRequests.id, claimRequestId))

    return NextResponse.json(
      {
        error: 'verification_failed',
        message: claim.method === 'dns_txt'
          ? 'Verification failed. Make sure the TXT record is published and try again.'
          : 'Verification failed. Make sure you are a public member of the GitHub organization.',
      },
      { status: 422 }
    )
  }

  // Atomic transaction: mark claim verified + set claimedByOrgId (only if still unclaimed)
  const result = await withAudit(
    ctx.userId,
    'claim.verified',
    'product',
    String(claim.productId),
    async () => {
      const rows = await db.select().from(Products).where(eq(Products.id, claim.productId)).limit(1)
      return rows[0] ?? null
    },
    async (tx) => {
      await tx
        .update(ClaimRequests)
        .set({ status: 'verified' })
        .where(eq(ClaimRequests.id, claimRequestId))

      const updated = await tx
        .update(Products)
        .set({ claimedByOrgId: claim.organizationId })
        .where(
          and(
            eq(Products.id, claim.productId),
            isNull(Products.claimedByOrgId),
          )
        )
        .returning({ id: Products.id })

      return updated.length > 0
    },
  )

  if (!result) {
    return NextResponse.json(
      {
        error: 'already_claimed',
        message: 'This product was claimed by another organization during verification.',
      },
      { status: 409 }
    )
  }

  // Notify all org members with manage_settings permission (owners + admins)
  const CLERK_ORG_ID = orgRows[0].clerkOrgId
  const notifyMember = async (memberId: string) => {
    await createNotification({
      organizationId: claim.organizationId,
      recipientId: memberId,
      eventType: 'claim_verified',
      title: 'Product claim verified',
      body: `Your claim for "${product.name}" has been verified successfully.`,
      metadata: { productId: product.id, productSlug: product.slug },
    })
  }

  try {
    const { default: clerkClient } = await import('@clerk/nextjs/server')
    const members = await clerkClient.organizations.getOrganizationMembershipList({
      organizationId: CLERK_ORG_ID,
      pageSize: 100,
    })
    for (const m of members.data) {
      if (m.role === 'org:owner' || m.role === 'org:admin') {
        await notifyMember(m.publicUserData?.userId ?? '')
      }
    }
  } catch {
    // Best-effort notification — don't fail the claim on notification error
  }

  return NextResponse.json(
    { message: 'Product claimed successfully!' },
    { status: 200 }
  )
}
