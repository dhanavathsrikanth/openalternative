import { db } from '@/app/db'
import { Contributions, Contributors, Products } from '@/app/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { Metadata } from 'next'
import { ModerationQueue } from './ModerationQueue'

export const metadata: Metadata = {
  title: 'Moderation Queue — Forklane',
}

export default async function ModerationPage() {
  const pendingContributions = await db
    .select({
      id: Contributions.id,
      productId: Contributions.productId,
      contributorId: Contributions.contributorId,
      changes: Contributions.changes,
      sourceUrl: Contributions.sourceUrl,
      status: Contributions.status,
      createdAt: Contributions.createdAt,
      productName: Products.name,
      productSlug: Products.slug,
      contributorEmail: Contributors.email,
      contributorName: Contributors.displayName,
      contributorRep: Contributors.reputationPoints,
    })
    .from(Contributions)
    .innerJoin(Products, eq(Contributions.productId, Products.id))
    .innerJoin(Contributors, eq(Contributions.contributorId, Contributors.id))
    .where(eq(Contributions.status, 'pending'))
    .orderBy(desc(Contributions.createdAt))

  return <ModerationQueue contributions={pendingContributions} />
}
