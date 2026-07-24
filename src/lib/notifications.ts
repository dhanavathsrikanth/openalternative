import { db } from '@/app/db'
import { Notifications } from '@/app/db/schema'

interface CreateNotificationOpts {
  organizationId: number
  recipientId: string
  eventType: string
  title: string
  body?: string
  metadata?: Record<string, unknown>
}

export async function createNotification(opts: CreateNotificationOpts) {
  await db.insert(Notifications).values({
    organizationId: opts.organizationId,
    recipientId: opts.recipientId,
    eventType: opts.eventType,
    title: opts.title,
    body: opts.body ?? null,
    metadata: opts.metadata ?? {},
  })
}
