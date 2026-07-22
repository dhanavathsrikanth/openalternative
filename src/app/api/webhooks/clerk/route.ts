import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/app/db'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { Users, Contributors } from '@/app/db/schema'
import { log } from '@/app/log'
import { eq } from 'drizzle-orm'
import getEnv from '@/app/config'
import { getPostHogClient } from '@/lib/posthog-server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function validateRequest(request: Request, secret: string) {
  const payloadString = await request.text()
  const headerPayload = await headers()

  const svixHeaders = {
    'svix-id': headerPayload.get('svix-id')!,
    'svix-timestamp': headerPayload.get('svix-timestamp')!,
    'svix-signature': headerPayload.get('svix-signature')!,
  }
  const wh = new Webhook(secret)

  try {
    return wh.verify(payloadString, svixHeaders) as WebhookEvent
  } catch (e) {
    console.error('incoming webhook failed verification')
    return
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  const config = getEnv(process.env)
  const payload = await validateRequest(req, config.CLERK_WEBHOOK_SECRET)

  if (!payload) {
    return NextResponse.json(
      { error: 'webhook verification failed or payload was malformed' },
      { status: 400 }
    )
  }

  const { type, data } = payload

  log.trace(`clerk webhook payload: ${{ data, type }}`)

  if (type === 'user.created') {
    return createUser(data as unknown as Record<string, unknown>)
  } else if (type === 'user.deleted') {
    return deleteUser(data.id)
  } else {
    log.warn(`${req.url} received event type "${type}", but no handler is defined for this type`)
    return NextResponse.json({
      error: `unrecognised payload type: ${type}`
    }, {
      status: 400
    })
  }
}

function extractEmail(data: Record<string, unknown>): string | null {
  const emailAddresses = data.email_addresses as
    | { id?: string; email_address?: string }[]
    | undefined
  if (!Array.isArray(emailAddresses) || emailAddresses.length === 0) {
    return null
  }

  // Prefer the primary verified email; fall back to first available
  const primary = emailAddresses.find(
    (e) => e.id === data.primary_email_address_id,
  )
  const raw = primary?.email_address ?? emailAddresses[0]?.email_address
  if (!raw || !EMAIL_REGEX.test(raw)) {
    return null
  }
  return raw
}

async function createUser(data: Record<string, unknown>) {
  try {
    log.info('creating user due to clerk webhook')

    await db.insert(Users).values({
      id: data.id as string,
      clerkCreateTs: new Date(data.created_at as number),
    })

    const email = extractEmail(data)
    if (!email) {
      log.warn(`user.created webhook for ${data.id}: no valid email found, skipping contributor creation`)
      return NextResponse.json({ message: 'user created (no email, contributor skipped)' }, { status: 200 })
    }

    await db.insert(Contributors).values({
      clerkUserId: data.id as string,
      email,
      displayName: 'Contributor',
    }).onConflictDoNothing({ target: Contributors.clerkUserId })

    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: data.id as string,
      event: 'user_signed_up',
    })
    posthog.identify({
      distinctId: data.id as string,
      properties: {
        name: [data.first_name, data.last_name].filter(Boolean).join(' ') || undefined,
        email: email ?? undefined,
      },
    })
    await posthog.flush()

    return NextResponse.json({
      message: 'user created'
    }, { status: 200 })
  } catch (error) {
    log.error('failed to create user', error)
    return NextResponse.json(
      { error: 'failed to create user' },
      { status: 500 }
    )
  }
}

async function deleteUser(id?: string) {
  if (!id) {
    log.warn('clerk sent a delete user request, but no user ID was included in the payload')
    return NextResponse.json({
      message: 'ok'
    }, { status: 200 })
  }

  try {
    log.info('delete user due to clerk webhook')
    await db.delete(Users).where(
      eq(Users.id, id)
    )

    return NextResponse.json({
      message: 'user deleted'
    }, { status: 200 })
  } catch (error) {
    log.error('failed to delete user', error)
    return NextResponse.json(
      { error: 'failed to delete user' },
      { status: 500 }
    )
  }
}
