import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { NewsletterSubscribers } from '@/app/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email } = body as { email: string }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  const existing = await db
    .select()
    .from(NewsletterSubscribers)
    .where(eq(NewsletterSubscribers.email, email.toLowerCase().trim()))
    .limit(1)

  if (existing.length > 0) {
    return NextResponse.json({ message: 'Already subscribed' }, { status: 200 })
  }

  await db.insert(NewsletterSubscribers).values({ email: email.toLowerCase().trim() })

  return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 })
}
