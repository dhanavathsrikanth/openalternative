import { db } from '@/app/db'
import { Products, ProductCategories, Categories, Reviews, Contributors, Announcements, ProductAssets, ProductContent, ProductTags, Tags } from '@/app/db/schema'
import { eq, and, desc, isNotNull, inArray } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ProductPage } from './ProductPage'
import { ContentBlocksRenderer } from '@/lib/blocks/renderer'
import { auth } from '@clerk/nextjs/server'

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

  const logoRow = await db
    .select({ url: ProductAssets.url })
    .from(ProductAssets)
    .where(and(eq(ProductAssets.productId, p.id), eq(ProductAssets.type, 'logo')))
    .limit(1)

  const logoUrl = logoRow[0]?.url

  const title = p.seoTitle || `${p.name} — Forklane`
  const description = p.seoDescription || p.description.slice(0, 160)

  return {
    title,
    description,
    ...(p.seoCanonicalUrl && { alternates: { canonical: p.seoCanonicalUrl } }),
    openGraph: {
      title: p.seoTitle || p.name,
      description,
      type: 'website',
      ...(logoUrl && { images: [{ url: logoUrl, alt: p.name }] }),
    },
    twitter: {
      card: 'summary',
      ...(logoUrl && { images: [logoUrl] }),
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

  const tagRows = await db
    .select({ name: Tags.name, slug: Tags.slug })
    .from(ProductTags)
    .innerJoin(Tags, eq(ProductTags.tagId, Tags.id))
    .where(eq(ProductTags.productId, product.id))

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

  const { orgId } = await auth()

  const announcementRows = await db
    .select({
      id: Announcements.id,
      title: Announcements.title,
      body: Announcements.body,
      publishedAt: Announcements.publishedAt,
    })
    .from(Announcements)
    .where(
      and(
        eq(Announcements.productId, product.id),
        isNotNull(Announcements.publishedAt),
      ),
    )
    .orderBy(desc(Announcements.publishedAt))

  const assetRows = await db
    .select({ type: ProductAssets.type, url: ProductAssets.url })
    .from(ProductAssets)
    .where(eq(ProductAssets.productId, product.id))

  // Fetch approved AI-generated content
  const contentRows = await db
    .select({
      contentType: ProductContent.contentType,
      output: ProductContent.output,
    })
    .from(ProductContent)
    .where(
      and(
        eq(ProductContent.productId, product.id),
        eq(ProductContent.reviewStatus, 'approved'),
      ),
    )

  // Build a map of contentType → output for easy access
  const approvedContent: Record<string, unknown> = {}
  for (const row of contentRows) {
    approvedContent[row.contentType] = row.output
  }

  // Fetch comparison target products for "Similar Tools" + "Versus" sections
  const versusData = approvedContent.versusAlternatives as
    | { comparisons: { comparedProductId: number; comparedProductName: string; body: string; summary: string }[] }
    | undefined

  const versusTargetIds = versusData?.comparisons?.map((c) => c.comparedProductId) ?? []

  // Also find same-category products for Similar Tools (if no versus data)
  let similarProducts: { id: number; name: string; slug: string; description: string; logoUrl: string | null }[] = []

  if (versusTargetIds.length > 0) {
    // Fetch the versus comparison targets
    const targetRows = versusTargetIds.length === 1
      ? await db.select().from(Products).where(eq(Products.id, versusTargetIds[0]))
      : await db.select().from(Products).where(inArray(Products.id, versusTargetIds))

    const targetIds = targetRows.map((p) => p.id)
    const targetAssets = targetIds.length > 0
      ? await db
          .select({ productId: ProductAssets.productId, url: ProductAssets.url })
          .from(ProductAssets)
          .where(and(inArray(ProductAssets.productId, targetIds), eq(ProductAssets.type, 'logo')))
      : []

    similarProducts = targetRows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      logoUrl: targetAssets.find((a) => a.productId === p.id)?.url ?? null,
    }))
  } else {
    // Fallback: find same-category products for "Similar Tools"
    const categoryIds = (await db
      .select({ categoryId: ProductCategories.categoryId })
      .from(ProductCategories)
      .where(eq(ProductCategories.productId, product.id))
    ).map((r) => r.categoryId)

    if (categoryIds.length > 0) {
      const catCondition = categoryIds.length === 1
        ? eq(ProductCategories.categoryId, categoryIds[0])
        : undefined

      const sameCatRows = await db
        .select({ id: Products.id, name: Products.name, slug: Products.slug, description: Products.description })
        .from(Products)
        .innerJoin(ProductCategories, eq(ProductCategories.productId, Products.id))
        .where(
          and(
            eq(Products.status, 'published'),
            catCondition!,
          ),
        )
        .limit(6)

      const similarIds = sameCatRows.filter((p) => p.id !== product.id).slice(0, 3).map((p) => p.id)
      const similarAssets = similarIds.length > 0
        ? await db
            .select({ productId: ProductAssets.productId, url: ProductAssets.url })
            .from(ProductAssets)
            .where(and(inArray(ProductAssets.productId, similarIds), eq(ProductAssets.type, 'logo')))
        : []

      similarProducts = sameCatRows
        .filter((p) => p.id !== product.id)
        .slice(0, 3)
        .map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          logoUrl: similarAssets.find((a) => a.productId === p.id)?.url ?? null,
        }))
    }
  }

  // Server-render content blocks to HTML for SEO/AEO
  const contentBlocks = product.contentBlocks as unknown[] | null
  const hasContentBlocks = contentBlocks && Array.isArray(contentBlocks) && contentBlocks.length > 0

  return (
    <ProductPage
      product={product}
      categories={catRows}
      tags={tagRows}
      reviews={reviewRows}
      announcements={announcementRows}
      approvedContent={approvedContent}
      similarProducts={similarProducts}
      currentOrgId={orgId ?? null}
      logoUrl={assetRows.find((a) => a.type === 'logo')?.url ?? null}
      screenshotUrls={assetRows.filter((a) => a.type === 'screenshot').map((a) => a.url)}
      contentBlocksHtml={
        hasContentBlocks ? (
          <ContentBlocksRenderer contentBlocks={contentBlocks} />
        ) : undefined
      }
      contentBlocks={contentBlocks}
    />
  )
}
