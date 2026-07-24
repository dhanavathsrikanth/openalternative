import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/app/db'
import { Organizations } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { getClerkClient } from '@/lib/clerk-client'
import { TeamManager } from './TeamManager'

type PageProps = { params: Promise<{ orgSlug: string }> }

const ROLE_HIERARCHY: Record<string, number> = {
  'org:owner': 50, 'org:admin': 40, 'org:editor': 30, 'org:marketing': 20, 'org:viewer': 10,
}

export default async function TeamPage({ params }: PageProps) {
  const session = await auth()
  if (!session.userId || !session.orgId) redirect('/sign-in')

  const { orgSlug } = await params

  const orgRows = await db
    .select()
    .from(Organizations)
    .where(eq(Organizations.slug, orgSlug))
    .limit(1)

  if (orgRows.length === 0) notFound()
  const org = orgRows[0]
  if (org.clerkOrgId !== session.orgId) redirect('/')

  const role = (session.orgRole ?? 'org:viewer') as string
  if ((ROLE_HIERARCHY[role] ?? 0) < (ROLE_HIERARCHY['org:admin'] ?? 40)) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Team</h1>
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          You need the Admin role or higher to manage team members.
        </div>
      </div>
    )
  }

  const client = await getClerkClient()

  const memberships = await client.organizations.getOrganizationMembershipList({
    organizationId: org.clerkOrgId,
    pageSize: 100,
  })

  const invitations = await client.organizations.getOrganizationInvitationList({
    organizationId: org.clerkOrgId,
    pageSize: 100,
  })

  const members = memberships.data.map((m) => ({
    id: m.id,
    userId: m.publicUserData?.userId ?? '',
    name: [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ') || null,
    email: m.publicUserData?.emailAddress ?? '',
    imageUrl: m.publicUserData?.imageUrl ?? null,
    role: m.role,
  }))

  const pendingInvites = invitations.data
    .filter((inv) => inv.status === 'pending')
    .map((inv) => ({
      id: inv.id,
      email: inv.emailAddress,
      role: inv.role,
      createdAt: inv.createdAt,
    }))

  const ownerCount = members.filter((m) => m.role === 'org:owner').length

  return (
    <TeamManager
      orgSlug={orgSlug}
      orgId={org.clerkOrgId}
      currentUserId={session.userId}
      currentRole={role}
      members={members}
      pendingInvites={pendingInvites}
      ownerCount={ownerCount}
    />
  )
}
