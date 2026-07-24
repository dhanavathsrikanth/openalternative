import { db } from '@/app/db'
import { Products, Categories, ProductCategories, ProductTags, Tags } from '@/app/db/schema'
import { eq, sql, desc, inArray } from 'drizzle-orm'
import { Homepage } from './Homepage'
import { FaqJsonLd } from './FaqJsonLd'

export const revalidate = 86400 // 24h ISR

export default async function Home() {
  // Live stats for hero badge
  const [stats] = await db
    .select({
      productCount: sql<number>`count(*)::int`.as('product_count'),
      latestVerifiedAt: sql<Date | null>`max(${Products.lastVerifiedAt})`.as('latest_verified_at'),
    })
    .from(Products)
    .where(eq(Products.status, 'published'))

  // Trending: top 6 by confidence score (highest first)
  const trending = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      description: Products.description,
      tagline: Products.tagline,
      license: Products.license,
      primaryLanguage: Products.primaryLanguage,
      confidenceScore: Products.confidenceScore,
      stars: Products.stars,
      forks: Products.forks,
    })
    .from(Products)
    .where(eq(Products.status, 'published'))
    .orderBy(desc(sql`COALESCE(${Products.confidenceScore}::numeric, 0)`))
    .limit(6)

  // Popular categories: top 6 with product count
  const categories = await db
    .select({
      id: Categories.id,
      name: Categories.name,
      slug: Categories.slug,
      description: Categories.description,
      productCount: sql<number>`count(${ProductCategories.productId})::int`,
    })
    .from(Categories)
    .leftJoin(ProductCategories, eq(Categories.id, ProductCategories.categoryId))
    .groupBy(Categories.id)
    .orderBy(desc(sql`count(${ProductCategories.productId})`))
    .limit(6)

  // Recently updated: last 6 by updatedAt
  const recent = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      description: Products.description,
      tagline: Products.tagline,
      license: Products.license,
      primaryLanguage: Products.primaryLanguage,
      confidenceScore: Products.confidenceScore,
      stars: Products.stars,
      forks: Products.forks,
      updatedAt: Products.updatedAt,
    })
    .from(Products)
    .where(eq(Products.status, 'published'))
    .orderBy(desc(Products.updatedAt))
    .limit(6)

  // Fetch tags for all displayed products in one query
  const allProductIds = [
    ...trending.map((p) => p.id),
    ...recent.map((p) => p.id),
  ]

  const tagRows = allProductIds.length > 0
    ? await db
        .select({
          productId: ProductTags.productId,
          tagName: Tags.name,
        })
        .from(ProductTags)
        .innerJoin(Tags, eq(ProductTags.tagId, Tags.id))
        .where(inArray(ProductTags.productId, allProductIds))
    : []

  const tagsByProduct = new Map<number, string[]>()
  for (const row of tagRows) {
    const existing = tagsByProduct.get(row.productId) ?? []
    existing.push(row.tagName)
    tagsByProduct.set(row.productId, existing)
  }

  const trendingWithTags = trending.map((p) => ({ ...p, tags: tagsByProduct.get(p.id) ?? [] }))
  const recentWithTags = recent.map((p) => ({ ...p, tags: tagsByProduct.get(p.id) ?? [] }))

  return (
    <>
      <FaqJsonLd />
      <Homepage
        trending={trendingWithTags}
        categories={categories}
        recent={recentWithTags}
        productCount={stats?.productCount ?? 0}
        latestVerifiedAt={stats?.latestVerifiedAt ?? null}
      />
    </>
  )
}
