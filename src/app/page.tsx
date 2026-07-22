import { db } from '@/app/db'
import { Products, Categories, ProductCategories } from '@/app/db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { Homepage } from './Homepage'

export const revalidate = 86400 // 24h ISR

export default async function Home() {
  // Trending: top 6 by confidence score (highest first)
  const trending = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      description: Products.description,
      license: Products.license,
      primaryLanguage: Products.primaryLanguage,
      confidenceScore: Products.confidenceScore,
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
      license: Products.license,
      primaryLanguage: Products.primaryLanguage,
      confidenceScore: Products.confidenceScore,
      updatedAt: Products.updatedAt,
    })
    .from(Products)
    .where(eq(Products.status, 'published'))
    .orderBy(desc(Products.updatedAt))
    .limit(6)

  return <Homepage trending={trending} categories={categories} recent={recent} />
}
