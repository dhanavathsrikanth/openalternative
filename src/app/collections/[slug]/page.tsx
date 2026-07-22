import { db } from '@/app/db'
import { Collections, CollectionProducts, Products } from '@/app/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CollectionPage } from './CollectionPage'

export const revalidate = 86400 // 24h ISR

type PageProps = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const cols = await db.select({ slug: Collections.slug }).from(Collections)
  return cols.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const rows = await db
    .select()
    .from(Collections)
    .where(eq(Collections.slug, slug))
    .limit(1)

  if (rows.length === 0) return { title: 'Not Found — Forklane' }

  const col = rows[0]
  return {
    title: `${col.title} — Forklane`,
    description: col.description ?? `Curated collection of open-source alternatives`,
  }
}

export default async function CollectionSlugPage({ params }: PageProps) {
  const { slug } = await params

  const colRows = await db
    .select()
    .from(Collections)
    .where(eq(Collections.slug, slug))
    .limit(1)

  if (colRows.length === 0) notFound()

  const collection = colRows[0]

  const products = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      description: Products.description,
      license: Products.license,
      primaryLanguage: Products.primaryLanguage,
      deploymentMethods: Products.deploymentMethods,
      confidenceScore: Products.confidenceScore,
      githubUrl: Products.githubUrl,
    })
    .from(CollectionProducts)
    .innerJoin(Products, eq(CollectionProducts.productId, Products.id))
    .where(eq(CollectionProducts.collectionId, collection.id))
    .orderBy(desc(sql`COALESCE(${Products.confidenceScore}::numeric, 0)`))

  return <CollectionPage collection={collection} products={products} />
}
