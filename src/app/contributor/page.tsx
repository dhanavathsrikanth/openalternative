import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/app/db'
import { Contributors } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { ContributorDashboard } from './ContributorDashboard'

export default async function ContributorDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/contributor/sign-in')

  // Find or create contributor record
  const rows = await db
    .select()
    .from(Contributors)
    .where(eq(Contributors.clerkUserId, userId))
    .limit(1)

  if (rows.length === 0) {
    // Auto-create contributor from Clerk user ID
    // Real email will be synced via webhook or backfill
    const [contributor] = await db
      .insert(Contributors)
      .values({
        clerkUserId: userId,
        email: `${userId}@placeholder.local`,
        displayName: 'Contributor',
      })
      .returning()

    return <ContributorDashboard contributor={contributor} />
  }

  return <ContributorDashboard contributor={rows[0]} />
}
