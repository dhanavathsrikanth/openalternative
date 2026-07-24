import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/app/db'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { Users, Contributors, Organizations } from '@/app/db/schema'
import { log } from '@/app/log'
import { eq } from 'drizzle-orm'
import getEnv from '@/app/config'
import { getPostHogClient } from '@/lib/posthog-server'
import { createNotification } from '@/lib/notifications'
import { getClerkClient } from '@/lib/clerk-client'

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
  } else if (type === 'organization.created') {
    return createOrganization(data as unknown as Record<string, unknown>)
  } else if (type === 'organization.updated') {
    return updateOrganization(data as unknown as Record<string, unknown>)
  } else if (type === 'organization.deleted') {
    return deleteOrganization(data.id as string)
  } else if (type === 'organizationMembership.created') {
    return createOrganizationMembership(data as unknown as Record<string, unknown>)
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

async function createOrganization(data: Record<string, unknown>) {
  try {
    log.info('creating organization due to clerk webhook')

    await db.insert(Organizations).values({
      clerkOrgId: data.id as string,
      slug: (data.slug as string) || (data.id as string),
      name: data.name as string,
    })

    return NextResponse.json({
      message: 'organization created'
    }, { status: 200 })
  } catch (error) {
    log.error('failed to create organization', error)
    return NextResponse.json(
      { error: 'failed to create organization' },
      { status: 500 }
    )
  }
}

async function updateOrganization(data: Record<string, unknown>) {
  try {
    log.info('updating organization due to clerk webhook')

    await db.update(Organizations)
      .set({ name: data.name as string, slug: (data.slug as string) || (data.name as string).toLowerCase().replace(/\s+/g, '-') })
      .where(eq(Organizations.clerkOrgId, data.id as string))

    return NextResponse.json({
      message: 'organization updated'
    }, { status: 200 })
  } catch (error) {
    log.error('failed to update organization', error)
    return NextResponse.json(
      { error: 'failed to update organization' },
      { status: 500 }
    )
  }
}

async function deleteOrganization(id: string) {
  if (!id) {
    log.warn('clerk sent a delete organization request, but no org ID was included in the payload')
    return NextResponse.json({
      message: 'ok'
    }, { status: 200 })
  }

  try {
    log.info('delete organization due to clerk webhook')
    await db.delete(Organizations).where(
      eq(Organizations.clerkOrgId, id)
    )

    return NextResponse.json({
      message: 'organization deleted'
    }, { status: 200 })
  } catch (error) {
    log.error('failed to delete organization', error)
    return NextResponse.json(
      { error: 'failed to delete organization' },
      { status: 500 }
    )
  }
}

async function createOrganizationMembership(data: Record<string, unknown>) {
  try {
    log.info('processing organizationMembership.created webhook')

    const orgId = (data.organization as Record<string, unknown>)?.id as string | undefined
    const userId = (data.public_user_data as Record<string, unknown>)?.user_id as string | undefined
    const invitedUserEmail = (data.public_user_data as Record<string, unknown>)?.email_address as string | undefined
    const inviterName = (data.inviter as Record<string, unknown>)?.email_address as string | undefined

    if (!orgId || !userId) {
      log.warn('orgMembership.created missing orgId or userId, skipping notification')
      return NextResponse.json({ message: 'skipped — missing data' }, { status: 200 })
    }

    // Look up the org row to get organizationId for notifications
    const orgRows = await db
      .select({ id: Organizations.id })
      .from(Organizations)
      .where(eq(Organizations.clerkOrgId, orgId))
      .limit(1)

    if (orgRows.length === 0) {
      log.warn(`orgMembership.created: org ${orgId} not found in DB, skipping`)
      return NextResponse.json({ message: 'skipped — org not in DB' }, { status: 200 })
    }

    const organizationId = orgRows[0].id

    // Notify org owners and admins about the new member
    try {
      const client = await getClerkClient()
      const members = await client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        pageSize: 100,
      })

      for (const m of members.data) {
        if (m.role === 'org:owner' || m.role === 'org:admin') {
          const recipientUserId = m.publicUserData?.userId
          if (!recipientUserId) continue

          await createNotification({
            organizationId,
            recipientId: recipientUserId,
            eventType: 'team_invite',
            title: 'New team member',
            body: inviterName
              ? `${inviterName} invited ${invitedUserEmail ?? 'a user'} to the team`
              : `${invitedUserEmail ?? 'A user'} joined the team`,
            metadata: {
              invitedUserId: userId,
              invitedUserEmail,
              role: data.role,
            },
          })
        }
      }
    } catch {
      // Best-effort — don't fail the webhook
    }

    return NextResponse.json({
      message: 'orgMembership.created processed'
    }, { status: 200 })
  } catch (error) {
    log.error('failed to process orgMembership.created', error)
    return NextResponse.json(
      { error: 'failed to process orgMembership.created' },
      { status: 500 }
    )
  }
}
