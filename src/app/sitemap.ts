import { db } from '@/app/db'
import { Products, Categories, Comparisons, Guides, ProprietaryTools, ProductAlternatives } from '@/app/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://forklane.dev'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/categories`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guides`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/graveyard`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.4,
    },
  ]

  // Product pages (published + delisted — delisted pages must remain indexable for SEO continuity)
  const products = await db
    .select({
      slug: Products.slug,
      updatedAt: Products.updatedAt,
      status: Products.status,
    })
    .from(Products)
    .where(inArray(Products.status, ['published', 'delisted']))

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Category pages
  const categories = await db
    .select({
      slug: Categories.slug,
    })
    .from(Categories)

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/categories/${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Comparison pages
  const comparisons = await db
    .select({
      productAId: Comparisons.productAId,
      productBId: Comparisons.productBId,
    })
    .from(Comparisons)

  // Resolve product slugs for comparison URLs (only published products)
  const allProducts = await db
    .select({ id: Products.id, slug: Products.slug })
    .from(Products)
    .where(inArray(Products.status, ['published']))

  const slugById = new Map(allProducts.map((p) => [p.id, p.slug]))

  const comparisonPages: MetadataRoute.Sitemap = comparisons
    .filter((c) => slugById.has(c.productAId) && slugById.has(c.productBId))
    .map((c) => {
      const slugA = slugById.get(c.productAId)!
      const slugB = slugById.get(c.productBId)!
      const canonical = slugA < slugB ? `${slugA}-vs-${slugB}` : `${slugB}-vs-${slugA}`
      return {
        url: `${BASE_URL}/compare/${canonical}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }
    })

  // Guide pages
  const guides = await db
    .select({
      slug: Guides.slug,
      updatedAt: Guides.updatedAt,
    })
    .from(Guides)
    .where(eq(Guides.status, 'published'))

  const guidePages: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${BASE_URL}/guides/${g.slug}`,
    lastModified: g.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Proprietary tool alternatives pages (only tools with at least one published alternative)
  const proprietaryToolSlugs = await db
    .select({ slug: ProprietaryTools.slug })
    .from(ProprietaryTools)
    .innerJoin(ProductAlternatives, eq(ProprietaryTools.id, ProductAlternatives.proprietaryToolId))
    .innerJoin(Products, and(eq(ProductAlternatives.productId, Products.id), eq(Products.status, 'published')))

  const uniqueToolSlugs = [...new Set(proprietaryToolSlugs.map((t) => t.slug))]

  const alternativesPages: MetadataRoute.Sitemap = uniqueToolSlugs.map((slug) => ({
    url: `${BASE_URL}/alternatives-to/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...productPages, ...categoryPages, ...comparisonPages, ...guidePages, ...alternativesPages]
}
