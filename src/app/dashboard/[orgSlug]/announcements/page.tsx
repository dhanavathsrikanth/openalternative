import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/app/db'
import { Organizations } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { AnnouncementsManager } from './AnnouncementsManager'

type PageProps = { params: Promise<{ orgSlug: string }> }

export default async function AnnouncementsPage({ params }: PageProps) {
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

  return <AnnouncementsManager orgSlug={orgSlug} />
}
