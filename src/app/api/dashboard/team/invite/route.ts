import { NextResponse } from 'next/server'
import { requireSession, AuthError, ROLE_HIERARCHY } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { getClerkClient } from '@/lib/clerk-client'

/**
 * POST /api/dashboard/team/invite — invite a member by email
 */
export async function POST(req: Request): Promise<NextResponse> {
  let ctx
  try {
    ctx = await requireSession()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof AuthError ? e.message : 'unauthorized' },
      { status: 401 }
    )
  }

  if ((ROLE_HIERARCHY[ctx.orgRole] ?? 0) < (ROLE_HIERARCHY['org:admin'] ?? 40)) {
    return NextResponse.json({ error: 'admin role or higher required' }, { status: 403 })
  }

  let body: { email?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (!body.email || typeof body.email !== 'string') {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const validRoles = ['org:owner', 'org:admin', 'org:editor', 'org:marketing', 'org:viewer']
  const role = validRoles.includes(body.role ?? '') ? body.role! : 'org:viewer'

  // Admins can only invite up to admin level
  if (ctx.orgRole === 'org:admin' && (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY['org:admin'] ?? 40)) {
    return NextResponse.json({ error: 'admins cannot invite other admins or owners' }, { status: 403 })
  }

  const client = await getClerkClient()

  try {
    await client.organizations.inviteOrganizationMember({
      organizationId: ctx.orgId,
      emailAddress: body.email,
      role,
    })

    await logAudit(ctx.userId, 'team.invite_sent', 'member', body.email, null, { role })

    return NextResponse.json({ message: 'invite sent' }, { status: 200 })
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message || err?.message || 'failed to send invite'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

/**
 * DELETE /api/dashboard/team/invite — revoke a pending invitation
 */
export async function DELETE(req: Request): Promise<NextResponse> {
  let ctx
  try {
    ctx = await requireSession()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof AuthError ? e.message : 'unauthorized' },
      { status: 401 }
    )
  }

  if ((ROLE_HIERARCHY[ctx.orgRole] ?? 0) < (ROLE_HIERARCHY['org:admin'] ?? 40)) {
    return NextResponse.json({ error: 'admin role or higher required' }, { status: 403 })
  }

  let body: { invitationId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  if (!body.invitationId) {
    return NextResponse.json({ error: 'invitationId is required' }, { status: 400 })
  }

  const client = await getClerkClient()

  try {
    await client.organizations.revokeOrganizationInvitation({
      organizationId: ctx.orgId,
      invitationId: body.invitationId,
    })

    await logAudit(ctx.userId, 'team.invite_revoked', 'member', body.invitationId, null, null)

    return NextResponse.json({ message: 'invitation revoked' }, { status: 200 })
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message || err?.message || 'failed to revoke invitation'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
