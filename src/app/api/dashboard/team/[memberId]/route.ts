import { NextResponse } from 'next/server'
import { requireSession, AuthError, ROLE_HIERARCHY } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { getClerkClient } from '@/lib/clerk-client'

type RouteContext = { params: Promise<{ memberId: string }> }

/**
 * PATCH /api/dashboard/team/[memberId] — change a member's role
 */
export async function PATCH(req: Request, { params }: RouteContext): Promise<NextResponse> {
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

  const { memberId } = await params

  let body: { role?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const validRoles = ['org:owner', 'org:admin', 'org:editor', 'org:marketing', 'org:viewer']
  if (!body.role || !validRoles.includes(body.role)) {
    return NextResponse.json({ error: `role must be one of: ${validRoles.join(', ')}` }, { status: 400 })
  }

  // Admins cannot promote to admin or owner
  if (ctx.orgRole === 'org:admin' && (ROLE_HIERARCHY[body.role] ?? 0) >= (ROLE_HIERARCHY['org:admin'] ?? 40)) {
    return NextResponse.json({ error: 'admins cannot assign admin or owner roles' }, { status: 403 })
  }

  const client = await getClerkClient()

  // Check last-owner safeguard before demoting
  if (body.role !== 'org:owner') {
    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId: ctx.orgId,
      pageSize: 100,
    })
    const owners = memberships.data.filter((m) => m.role === 'org:owner')
    const isTargetOwner = owners.some((o) => o.id === memberId)

    if (isTargetOwner && owners.length <= 1) {
      return NextResponse.json(
        { error: 'cannot demote the last owner' },
        { status: 409 }
      )
    }
  }

  // Prevent self-demotion from owner if last owner
  if (body.role !== 'org:owner') {
    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId: ctx.orgId,
      pageSize: 100,
    })
    const selfMembership = memberships.data.find((m) => m.publicUserData?.userId === ctx.userId)
    const owners = memberships.data.filter((m) => m.role === 'org:owner')
    if (selfMembership?.id === memberId && selfMembership?.role === 'org:owner' && owners.length <= 1) {
      return NextResponse.json(
        { error: 'you cannot demote yourself as the last owner' },
        { status: 409 }
      )
    }
  }

  try {
    await client.organizations.updateOrganizationMembership({
      organizationId: ctx.orgId,
      userId: memberId,
      role: body.role,
    })

    await logAudit(ctx.userId, 'team.role_changed', 'member', memberId, null, { role: body.role })

    return NextResponse.json({ message: 'role updated' }, { status: 200 })
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message || err?.message || 'failed to update role'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

/**
 * DELETE /api/dashboard/team/[memberId] — remove a member
 */
export async function DELETE(req: Request, { params }: RouteContext): Promise<NextResponse> {
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

  const { memberId } = await params

  // Last-owner safeguard: cannot remove the last owner
  const client = await getClerkClient()

  const memberships = await client.organizations.getOrganizationMembershipList({
    organizationId: ctx.orgId,
    pageSize: 100,
  })

  const target = memberships.data.find((m) => m.id === memberId)
  if (!target) {
    return NextResponse.json({ error: 'member not found' }, { status: 404 })
  }

  // Prevent removing self
  if (target.publicUserData?.userId === ctx.userId) {
    return NextResponse.json({ error: 'you cannot remove yourself' }, { status: 409 })
  }

  // Last-owner safeguard
  const owners = memberships.data.filter((m) => m.role === 'org:owner')
  if (target.role === 'org:owner' && owners.length <= 1) {
    return NextResponse.json(
      { error: 'cannot remove the last owner' },
      { status: 409 }
    )
  }

  try {
    await client.organizations.removeOrganizationMember({
      organizationId: ctx.orgId,
      userId: target.publicUserData?.userId ?? '',
    })

    await logAudit(ctx.userId, 'team.member_removed', 'member', memberId, { role: target.role }, null)

    return NextResponse.json({ message: 'member removed' }, { status: 200 })
  } catch (err: any) {
    const msg = err?.errors?.[0]?.message || err?.message || 'failed to remove member'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
