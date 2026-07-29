import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products, Organizations, AnalyticsEvents, ClaimRequests } from '@/app/db/schema'
import { eq, gte, and, sql, desc } from 'drizzle-orm'
import { Resend } from 'resend'
import { verifySecret, unauthorized } from '@/lib/cron-auth'
import { createNotification } from '@/lib/notifications'
import { getClerkClient } from '@/lib/clerk-client'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  if (!verifySecret(req)) return unauthorized()

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Find all orgs that have claimed products
  const orgsWithProducts = await db
    .select({
      orgId: Organizations.id,
      clerkOrgId: Organizations.clerkOrgId,
      orgName: Organizations.name,
      orgSlug: Organizations.slug,
    })
    .from(Organizations)
    .innerJoin(Products, eq(Products.claimedByOrgId, Organizations.id))
    .groupBy(Organizations.id, Organizations.clerkOrgId, Organizations.name, Organizations.slug)

  if (orgsWithProducts.length === 0) {
    return NextResponse.json({ message: 'No orgs with claimed products' })
  }

  let emailsSent = 0
  let notificationsCreated = 0

  for (const org of orgsWithProducts) {
    // Get claimed products
    const claimedProducts = await db
      .select({ id: Products.id, name: Products.name, slug: Products.slug })
      .from(Products)
      .where(eq(Products.claimedByOrgId, org.orgId))

    // Get traffic per product (page views in last 7 days)
    const trafficRows = await db.execute(sql`
      SELECT
        product_id,
        COUNT(*)::int AS page_views
      FROM analytics_events
      WHERE product_id = ANY(${claimedProducts.map((p) => p.id)})
        AND event_type = 'page_view'
        AND occurred_at >= ${oneWeekAgo}
      GROUP BY product_id
    `)

    const trafficMap = new Map<number, number>()
    for (const row of (trafficRows as unknown as { rows: { product_id: number; page_views: number }[] }).rows ?? []) {
      trafficMap.set(row.product_id, row.page_views)
    }

    // Get pending team invites (Clerk pending invitations)
    let pendingInvites = 0
    try {
      const client = await getClerkClient()
      const invitations = await client.organizations.getOrganizationInvitationList({
        organizationId: org.clerkOrgId,
        status: ['pending'] as never,
        pageSize: 100,
      })
      pendingInvites = invitations.data.length
    } catch {
      // Clerk API may not be available
    }

    // Skip if no traffic and no pending invites
    const totalTraffic = Array.from(trafficMap.values()).reduce((a, b) => a + b, 0)
    if (totalTraffic === 0 && pendingInvites === 0) continue

    // Build email
    const productRows = claimedProducts
      .map((p) => {
        const views = trafficMap.get(p.id) ?? 0
        return `<tr>
          <td style="padding:6px 0;"><a href="https://forklane.dev/product/${p.slug}" style="color:#2563eb;text-decoration:none;">${p.name}</a></td>
          <td style="padding:6px 0;text-align:right;font-variant-numeric:tabular-nums;">${views.toLocaleString()}</td>
        </tr>`
      })
      .join('')

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:22px;font-weight:700;margin-bottom:4px;">Weekly Digest — ${org.orgName}</h1>
        <p style="color:#6b7280;font-size:14px;margin-bottom:20px;">
          Here's what happened with your claimed products this week.
        </p>

        <h2 style="font-size:16px;font-weight:600;margin-bottom:8px;">Traffic</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <thead>
            <tr style="border-bottom:1px solid #e5e7eb;">
              <th style="padding:6px 0;text-align:left;font-size:13px;color:#6b7280;">Product</th>
              <th style="padding:6px 0;text-align:right;font-size:13px;color:#6b7280;">Page Views</th>
            </tr>
          </thead>
          <tbody>${productRows}</tbody>
        </table>

        ${pendingInvites > 0 ? `
          <h2 style="font-size:16px;font-weight:600;margin-bottom:8px;">Team</h2>
          <p style="font-size:14px;color:#374151;">
            You have <strong>${pendingInvites}</strong> pending team invite${pendingInvites > 1 ? 's' : ''}.
            <a href="https://forklane.dev/dashboard/${org.orgSlug}/team" style="color:#2563eb;text-decoration:none;">Review invites →</a>
          </p>
        ` : ''}

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="font-size:12px;color:#9ca3af;">
          You're receiving this because you're an owner or admin of "${org.orgName}" on Forklane.
        </p>
      </div>
    `

    // Send email to owners and admins
    try {
      const client = await getClerkClient()
      const members = await client.organizations.getOrganizationMembershipList({
        organizationId: org.clerkOrgId,
        pageSize: 100,
      })

      const recipients: string[] = []
      for (const m of members.data) {
        if (m.role === 'org:owner' || m.role === 'org:admin') {
          const email = (m.publicUserData as Record<string, unknown> | undefined)?.emailAddress as string | undefined
          if (email) recipients.push(email)
        }
      }

      if (recipients.length > 0) {
        await resend.emails.send({
          from: 'Forklane <digest@forklane.dev>',
          to: recipients,
          subject: `Weekly Digest — ${claimedProducts.length} products, ${totalTraffic} page views`,
          html,
        })
        emailsSent += recipients.length

        // Create in-app notifications for each recipient
        for (const m of members.data) {
          if (m.role === 'org:owner' || m.role === 'org:admin') {
            const userId = m.publicUserData?.userId
            if (!userId) continue
            await createNotification({
              organizationId: org.orgId,
              recipientId: userId,
              eventType: 'digest_available',
              title: 'Weekly digest available',
              body: `${claimedProducts.length} products, ${totalTraffic} page views this week.`,
              metadata: { totalTraffic, productCount: claimedProducts.length },
            })
            notificationsCreated++
          }
        }
      }
    } catch {
      // Best-effort — continue with other orgs
    }
  }

  return NextResponse.json({
    message: 'Org digest sent',
    emailsSent,
    notificationsCreated,
    orgsProcessed: orgsWithProducts.length,
  })
}
