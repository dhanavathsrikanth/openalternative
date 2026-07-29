import { db } from '@/app/db'
import { Products, ProductCategories, Categories, Reviews, Contributors, Announcements, ProductAssets, ProductContent, ProductTags, Tags, Bookmarks, ProductAlternatives, ProprietaryTools } from '@/app/db/schema'
import { eq, and, desc, isNotNull, inArray, ne, sql } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ProductPage } from './ProductPage'
import { ContentBlocksRenderer } from '@/lib/blocks/renderer'
import { auth } from '@clerk/nextjs/server'
import type { FeaturedTool } from '@/components/featured/FeaturedToolCard'

const REVALIDATE_SECONDS = 24 * 60 * 60

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
    .where(and(eq(Products.slug, slug), inArray(Products.status, ['published', 'delisted'])))
    .limit(1)
  if (rows.length === 0) return { title: 'Not Found' }

  const p = rows[0]

  const logoRow = await db
    .select({ url: ProductAssets.url })
    .from(ProductAssets)
    .where(and(eq(ProductAssets.productId, p.id), eq(ProductAssets.type, 'logo')))
    .limit(1)

  const logoUrl = logoRow[0]?.url

  const title = p.seoTitle || `${p.name} — Open Alternative`
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

// ── Featured Tools query ───────────────────────────────────────────────────
//
// Selection logic (distinct from the "similar/related" concept):
//   - status = 'published' AND confidence_score IS NOT NULL
//   - Exclude the current product
//   - Sort by confidence_score DESC across ALL categories
//   - DISTINCT ON category_id — keep the highest-confidence tool per category
//   - Return up to 6 tools (fills a 3×2 grid)
//
// This is intentionally cross-category so the grid surfaces a diverse mix of
// high-quality tools rather than alternatives similar to the current product.

async function getFeaturedTools(excludeProductId: number): Promise<FeaturedTool[]> {
  const candidates = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      description: Products.description,
      stars: Products.stars,
      forks: Products.forks,
      lastPushedAt: Products.lastPushedAt,
      claimedByOrgId: Products.claimedByOrgId,
    })
    .from(Products)
    .where(
      and(
        eq(Products.status, 'published'),
        isNotNull(Products.confidenceScore),
        ne(Products.id, excludeProductId),
      ),
    )
    .orderBy(desc(sql`${Products.confidenceScore}::numeric`))
    .limit(60)

  if (candidates.length === 0) return []

  const candidateIds = candidates.map((c) => c.id)

  // Category memberships for the candidate set
  const catRows =
    candidateIds.length === 1
      ? await db
          .select({ productId: ProductCategories.productId, categoryId: ProductCategories.categoryId })
          .from(ProductCategories)
          .where(eq(ProductCategories.productId, candidateIds[0]))
      : await db
          .select({ productId: ProductCategories.productId, categoryId: ProductCategories.categoryId })
          .from(ProductCategories)
          .where(inArray(ProductCategories.productId, candidateIds))

  const productCategory = new Map<number, number>()
  for (const row of catRows) {
    if (!productCategory.has(row.productId)) {
      productCategory.set(row.productId, row.categoryId)
    }
  }

  // Pick best-per-category (DISTINCT ON categoryId logic in JS)
  const seenCategories = new Set<number>()
  const selected: typeof candidates = []
  for (const p of candidates) {
    const catKey = productCategory.get(p.id) ?? -(p.id)
    if (!seenCategories.has(catKey)) {
      seenCategories.add(catKey)
      selected.push(p)
      if (selected.length === 6) break
    }
  }

  if (selected.length === 0) return []

  const selectedIds = selected.map((p) => p.id)
  const logoRows =
    selectedIds.length === 1
      ? await db
          .select({ productId: ProductAssets.productId, url: ProductAssets.url })
          .from(ProductAssets)
          .where(and(eq(ProductAssets.productId, selectedIds[0]), eq(ProductAssets.type, 'logo')))
      : await db
          .select({ productId: ProductAssets.productId, url: ProductAssets.url })
          .from(ProductAssets)
          .where(and(inArray(ProductAssets.productId, selectedIds), eq(ProductAssets.type, 'logo')))

  const logoMap = new Map(logoRows.map((r) => [r.productId, r.url]))

  return selected.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    logoUrl: logoMap.get(p.id) ?? null,
    isClaimed: p.claimedByOrgId !== null,
    stars: p.stars,
    forks: p.forks,
    lastPushedAt: p.lastPushedAt,
  }))
}

export default async function ProductSlugPage({ params }: PageProps) {
  const { slug } = await params

  const rows = await db
    .select()
    .from(Products)
    .where(and(eq(Products.slug, slug), inArray(Products.status, ['published', 'delisted'])))
    .limit(1)

  if (rows.length === 0) notFound()

  const product = rows[0]
  const isDelisted = product.status === 'delisted'
  const delistReason = product.delistReason ?? null
  const delistedAt = product.delistedAt ?? null

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

  let proprietaryToolRows: { id: number; name: string; url: string | null }[] = []
  try {
    proprietaryToolRows = await db
      .select({ id: ProprietaryTools.id, name: ProprietaryTools.name, url: ProprietaryTools.url })
      .from(ProductAlternatives)
      .innerJoin(ProprietaryTools, eq(ProductAlternatives.proprietaryToolId, ProprietaryTools.id))
      .where(eq(ProductAlternatives.productId, product.id))
  } catch {
    // Tables may not exist yet
  }

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

  const { userId, orgId } = await auth()
  const isSignedIn = Boolean(userId)

  let isBookmarked = false
  if (userId) {
    const bm = await db
      .select()
      .from(Bookmarks)
      .where(and(eq(Bookmarks.userId, userId), eq(Bookmarks.productId, product.id)))
      .limit(1)
    isBookmarked = bm.length > 0
  }

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

  const approvedContent: Record<string, unknown> = {}
  for (const row of contentRows) {
    approvedContent[row.contentType] = row.output
  }

  const versusData = approvedContent.versusAlternatives as
    | { comparisons: { comparedProductId: number; comparedProductName: string; body: string; summary: string }[] }
    | undefined

  const versusTargetIds = versusData?.comparisons?.map((c) => c.comparedProductId) ?? []

  let similarProducts: { id: number; name: string; slug: string; description: string; logoUrl: string | null }[] = []

  if (versusTargetIds.length > 0) {
    const targetRows = versusTargetIds.length === 1
      ? await db.select().from(Products).where(and(eq(Products.id, versusTargetIds[0]), eq(Products.status, 'published')))
      : await db.select().from(Products).where(and(inArray(Products.id, versusTargetIds), eq(Products.status, 'published')))

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

  const contentBlocks = product.contentBlocks as unknown[] | null
  const hasContentBlocks = contentBlocks && Array.isArray(contentBlocks) && contentBlocks.length > 0

  // Featured tools — high confidence_score, cross-category, excludes current product
  const featuredTools = await getFeaturedTools(product.id)

  // JSON-LD
  const softwareApp = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: product.description,
    url: product.homepageUrl ?? product.githubUrl ?? `https://forklane.dev/product/${product.slug}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    ...(assetRows.find((a) => a.type === 'logo')?.url && { image: assetRows.find((a) => a.type === 'logo')?.url }),
    ...(product.license && { license: `https://spdx.org/licenses/${product.license}` }),
    ...(product.primaryLanguage && { runtimePlatform: product.primaryLanguage }),
    ...(product.githubUrl && { codeRepository: product.githubUrl }),
    ...(product.confidenceScore && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Math.round(parseFloat(product.confidenceScore) / 20),
        bestRating: 5,
        ratingCount: 1,
        name: 'Migration confidence score',
      },
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      <ProductPage
        product={product}
        categories={catRows}
        tags={tagRows}
        proprietaryTools={proprietaryToolRows}
        reviews={reviewRows}
        announcements={announcementRows}
        approvedContent={approvedContent}
        similarProducts={similarProducts}
        currentOrgId={orgId ?? null}
        isBookmarked={isBookmarked}
        isSignedIn={isSignedIn}
        logoUrl={assetRows.find((a) => a.type === 'logo')?.url ?? null}
        screenshotUrls={assetRows.filter((a) => a.type === 'screenshot').map((a) => a.url)}
        contentBlocksHtml={
          hasContentBlocks ? (
            <ContentBlocksRenderer contentBlocks={contentBlocks} />
          ) : undefined
        }
        contentBlocks={contentBlocks}
        isDelisted={isDelisted}
        delistReason={delistReason}
        delistedAt={delistedAt}
        hostingPartnerUrl={null}
        featuredTools={featuredTools}
      />
    </>
  )
}
