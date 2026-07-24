import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { NewsletterSubscribers } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { getPostHogClient } from '@/lib/posthog-server'
import { newsletterSchema, formatZodError } from '@/lib/validation'

export async function POST(req: NextRequest) {
  const raw = await req.json()
  const parsed = newsletterSchema.safeParse(raw)

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase().trim()

  const existing = await db
    .select()
    .from(NewsletterSubscribers)
    .where(eq(NewsletterSubscribers.email, email))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ message: 'Already subscribed' }, { status: 200 })
  }

  await db.insert(NewsletterSubscribers).values({ email })

  const posthog = getPostHogClient()
  posthog.capture({
    distinctId: email.toLowerCase().trim(),
    event: 'newsletter_subscription_created',
  })
  await posthog.flush()

  return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 })
}
