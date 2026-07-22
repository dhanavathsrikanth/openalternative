import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products, NewsletterSubscribers } from '@/app/db/schema'
import { desc, gte } from 'drizzle-orm'
import { Resend } from 'resend'
import { verifySecret, unauthorized } from '@/lib/cron-auth'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  if (!verifySecret(req)) return unauthorized()

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const recentProducts = await db
    .select()
    .from(Products)
    .where(gte(Products.updatedAt, oneWeekAgo))
    .orderBy(desc(Products.updatedAt))
    .limit(20)

  if (recentProducts.length === 0) {
    return NextResponse.json({ message: 'No updates this week' })
  }

  const subscribers = await db.select().from(NewsletterSubscribers)

  if (subscribers.length === 0) {
    return NextResponse.json({ message: 'No subscribers' })
  }

  const baseUrl = 'https://forklane.dev'

  const productListHtml = recentProducts
    .map(
      (p) => `
      <tr>
        <td style="padding:8px 0;">
          <a href="${baseUrl}/products/${p.slug}" style="color:#2563eb;text-decoration:none;font-weight:500;">${p.name}</a>
          <span style="color:#6b7280;font-size:13px;margin-left:8px;">${p.primaryLanguage || ''}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 12px;color:#6b7280;font-size:13px;">${p.description.slice(0, 120)}${p.description.length > 120 ? '...' : ''}</td>
      </tr>
    `,
    )
    .join('')

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:4px;">Forklane Weekly Digest</h1>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">
        ${recentProducts.length} product${recentProducts.length > 1 ? 's' : ''} updated this week
      </p>
      <table style="width:100%;border-collapse:collapse;">
        ${productListHtml}
      </table>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:12px;color:#9ca3af;">
        You're receiving this because you subscribed to the Forklane weekly digest.
        <a href="${baseUrl}/unsubscribe" style="color:#9ca3af;">Unsubscribe</a>
      </p>
    </div>
  `

  const emailPromises = subscribers.map((sub: { id: number; email: string; createdAt: Date }) =>
    resend.emails.send({
      from: 'Forklane <digest@forklane.dev>',
      to: sub.email,
      subject: `Forklane Weekly: ${recentProducts.length} product updates`,
      html,
    }),
  )

  await Promise.allSettled(emailPromises)

  return NextResponse.json({
    message: `Digest sent to ${subscribers.length} subscribers`,
    productsUpdated: recentProducts.length,
  })
}
