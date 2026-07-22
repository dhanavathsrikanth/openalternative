import { db } from '@/app/db'
import { Products, ProductCategories, Categories, Reviews, Contributors } from '@/app/db/schema'
import { eq, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ProductPage } from './ProductPage'

const REVALIDATE_SECONDS = 24 * 60 * 60 // 24h ISR

type PageProps = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const products = await db
    .select({ slug: Products.slug })
    .from(Products)
    .where(eq(Products.status, 'published'))

  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const rows = await db
    .select()
    .from(Products)
    .where(and(eq(Products.slug, slug), eq(Products.status, 'published')))
    .limit(1)

  if (rows.length === 0) return { title: 'Not Found — Forklane' }

  const p = rows[0]
  return {
    title: `${p.name} — Forklane`,
    description: p.description.slice(0, 160),
    openGraph: {
      title: p.name,
      description: p.description.slice(0, 160),
      type: 'website',
    },
  }
}

export default async function ProductSlugPage({ params }: PageProps) {
  const { slug } = await params

  const rows = await db
    .select()
    .from(Products)
    .where(and(eq(Products.slug, slug), eq(Products.status, 'published')))
    .limit(1)

  if (rows.length === 0) notFound()

  const product = rows[0]

  const catRows = await db
    .select({ name: Categories.name, slug: Categories.slug })
    .from(ProductCategories)
    .innerJoin(Categories, eq(ProductCategories.categoryId, Categories.id))
    .where(eq(ProductCategories.productId, product.id))

  const reviewRows = await db
    .select({
      id: Reviews.id,
      rating: Reviews.rating,
      body: Reviews.body,
      createdAt: Reviews.createdAt,
      contributorName: Contributors.displayName,
    })
    .from(Reviews)
    .leftJoin(Contributors, eq(Reviews.contributorId, Contributors.id))
    .where(eq(Reviews.productId, product.id))

  return <ProductPage product={product} categories={catRows} reviews={reviewRows} />
}
