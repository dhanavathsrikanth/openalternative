import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { AnalyticsEvents } from '@/app/db/schema'

export async function POST(req: NextRequest) {
  let body: { eventType?: string; productId?: number; metadata?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { eventType, productId, metadata } = body
  if (!eventType || !productId || typeof productId !== 'number') {
    return NextResponse.json({ error: 'eventType and productId required' }, { status: 400 })
  }

  await db.insert(AnalyticsEvents).values({
    productId,
    eventType,
    metadata: metadata ?? {},
  })

  return NextResponse.json({ ok: true })
}
