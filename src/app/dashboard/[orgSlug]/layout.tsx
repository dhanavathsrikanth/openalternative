import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/app/db'
import { Organizations, Users } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { NotificationCenter } from '@/components/NotificationCenter'
import { DashboardNav } from './DashboardNav'

type LayoutProps = { children: React.ReactNode; params: Promise<{ orgSlug: string }> }

export default async function DashboardLayout({ children, params }: LayoutProps) {
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

  const staffRows = await db
    .select({ staff: Users.staff })
    .from(Users)
    .where(eq(Users.id, session.userId))
    .limit(1)
  const isStaff = staffRows[0]?.staff ?? false

  return (
    <div className="flex min-h-screen">
      <DashboardNav
        orgSlug={orgSlug}
        isStaff={isStaff}
        orgName={org.name}
        role={role}
        orgNotificationSlot={<NotificationCenter orgSlug={orgSlug} />}
      />
      <main className="main-content p-8">{children}</main>
    </div>
  )
}
