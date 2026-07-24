import { db } from '@/app/db'
import { Categories, Products, ProductCategories, Comparisons } from '@/app/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CategoryPage } from './CategoryPage'

export const revalidate = 86400 // 24h ISR

type PageProps = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const cats = await db.select({ slug: Categories.slug }).from(Categories)
  return cats.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const rows = await db
    .select()
    .from(Categories)
    .where(eq(Categories.slug, slug))
    .limit(1)

  if (rows.length === 0) return { title: 'Not Found — Forklane' }

  const cat = rows[0]
  const title = cat.seoTitle || `${cat.name} — Forklane`
  const description = cat.seoDescription || cat.description || `Browse open-source ${cat.name} alternatives on Forklane`

  return {
    title,
    description,
    ...(cat.seoCanonicalUrl && { alternates: { canonical: cat.seoCanonicalUrl } }),
  }
}

export default async function CategorySlugPage({ params }: PageProps) {
  const { slug } = await params

  const catRows = await db
    .select()
    .from(Categories)
    .where(eq(Categories.slug, slug))
    .limit(1)

  if (catRows.length === 0) notFound()

  const category = catRows[0]

  // Products in this category, ranked by confidence score
  const products = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      description: Products.description,
      license: Products.license,
      primaryLanguage: Products.primaryLanguage,
      deploymentMethods: Products.deploymentMethods,
      stars: Products.stars,
      forks: Products.forks,
      githubUrl: Products.githubUrl,
    })
    .from(Products)
    .innerJoin(ProductCategories, eq(Products.id, ProductCategories.productId))
    .where(
      and(
        eq(ProductCategories.categoryId, category.id),
        eq(Products.status, 'published'),
      ),
    )
    .orderBy(desc(sql`COALESCE(${Products.confidenceScore}::numeric, 0)`))

  // Comparisons for products in this category
  const comparisons = await db
    .select({
      id: Comparisons.id,
      productAId: Comparisons.productAId,
      productBId: Comparisons.productBId,
      nameA: sql<string>`(SELECT name FROM products WHERE id = ${Comparisons.productAId})`,
      slugA: sql<string>`(SELECT slug FROM products WHERE id = ${Comparisons.productAId})`,
      nameB: sql<string>`(SELECT name FROM products WHERE id = ${Comparisons.productBId})`,
      slugB: sql<string>`(SELECT slug FROM products WHERE id = ${Comparisons.productBId})`,
      generatedAt: Comparisons.generatedAt,
    })
    .from(Comparisons)
    .where(
      sql`${Comparisons.productAId} IN (SELECT product_id FROM product_categories WHERE category_id = ${category.id})`
    )

  return (
    <CategoryPage
      category={category}
      products={products}
      comparisons={comparisons}
    />
  )
}
