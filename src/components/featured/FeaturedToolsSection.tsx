/**
 * FeaturedToolsSection — server component
 *
 * Selection query (documented as requested, distinct from the "similar/related"
 * concept used elsewhere on the product page):
 *
 *   SELECT DISTINCT ON (pc.category_id)
 *     p.id, p.name, p.slug, p.description, p.stars, p.forks,
 *     p.last_pushed_at, p.claimed_by_org_id
 *   FROM products p
 *   JOIN product_categories pc ON pc.product_id = p.id
 *   WHERE p.status = 'published'
 *     AND p.confidence_score IS NOT NULL
 *     AND p.id != <currentProductId>          -- exclude the page-owner product
 *   ORDER BY pc.category_id, p.confidence_score DESC
 *   LIMIT 6
 *
 * This deliberately picks the *highest-confidence* tool in each category,
 * ensuring cross-category variety.  The optional `excludeProductId` param
 * prevents the current product from appearing in the list when rendering
 * its own detail page.
 *
 * This is **not** the same as the "similar tools" query (which filters to
 * the same category as the page product, or uses versusAlternatives IDs).
 */

import { db } from '@/app/db'
import {
  Products,
  ProductCategories,
  ProductAssets,
} from '@/app/db/schema'
import {
  eq,
  isNotNull,
  desc,
  and,
  ne,
  inArray,
  sql,
} from 'drizzle-orm'
import { type FeaturedTool } from './FeaturedToolCard'
import { FeaturedToolsDisplay } from './FeaturedToolsDisplay'

// ── query ──────────────────────────────────────────────────────────────────

/**
 * Fetch up to 6 featured tools spread across distinct categories, ordered by
 * confidence_score DESC within each category bucket.
 *
 * Because Drizzle ORM doesn't expose DISTINCT ON natively, we implement the
 * "pick best per category" logic in JS after a reasonably small candidate
 * fetch (top 60 by score). This is safe for the scale of this project and
 * avoids a raw-SQL escape hatch. If the catalogue grows large, this can be
 * replaced with a single SQL query using DISTINCT ON.
 */
async function fetchFeaturedTools(excludeProductId?: number): Promise<FeaturedTool[]> {
  // 1. Fetch top-60 published products by confidence_score (wide enough to
  //    cover many categories, narrow enough to be fast).
  const baseCondition = excludeProductId != null
    ? and(
        eq(Products.status, 'published'),
        isNotNull(Products.confidenceScore),
        ne(Products.id, excludeProductId),
      )
    : and(
        eq(Products.status, 'published'),
        isNotNull(Products.confidenceScore),
      )

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
      confidenceScore: Products.confidenceScore,
    })
    .from(Products)
    .where(baseCondition!)
    .orderBy(desc(sql`${Products.confidenceScore}::numeric`))
    .limit(60)

  if (candidates.length === 0) return []

  // 2. Load category memberships for these candidates.
  const candidateIds = candidates.map((c) => c.id)
  const catRows = await db
    .select({ productId: ProductCategories.productId, categoryId: ProductCategories.categoryId })
    .from(ProductCategories)
    .where(
      candidateIds.length === 1
        ? eq(ProductCategories.productId, candidateIds[0])
        : inArray(ProductCategories.productId, candidateIds),
    )

  // Build a map: productId → first categoryId
  const productCategory = new Map<number, number>()
  for (const row of catRows) {
    if (!productCategory.has(row.productId)) {
      productCategory.set(row.productId, row.categoryId)
    }
  }

  // 3. DISTINCT ON categoryId — keep the first (highest-score) product per
  //    category. Products with no category get a synthetic key of -<id>.
  const seenCategories = new Set<number>()
  const selected: typeof candidates = []

  for (const p of candidates) {
    const catId = productCategory.get(p.id) ?? -(p.id)
    if (!seenCategories.has(catId)) {
      seenCategories.add(catId)
      selected.push(p)
      if (selected.length === 6) break
    }
  }

  if (selected.length === 0) return []

  // 4. Fetch logo assets for selected products.
  const selectedIds = selected.map((p) => p.id)
  const logoRows = await db
    .select({ productId: ProductAssets.productId, url: ProductAssets.url })
    .from(ProductAssets)
    .where(
      and(
        selectedIds.length === 1
          ? eq(ProductAssets.productId, selectedIds[0])
          : inArray(ProductAssets.productId, selectedIds),
        eq(ProductAssets.type, 'logo'),
      ),
    )

  const logoMap = new Map(logoRows.map((r) => [r.productId, r.url]))

  // 5. Shape into FeaturedTool.
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

// ── section component ───────────────────────────────────────────────────────

interface ServerProps {
  /** Exclude the current product from the featured list (default: undefined) */
  excludeProductId?: number
}

/**
 * Server component that fetches + renders in one step.
 * Use this when you don't need to pass the data through props.
 */
export async function FeaturedToolsSection({ excludeProductId }: ServerProps) {
  const tools = await fetchFeaturedTools(excludeProductId)
  return <FeaturedToolsDisplay tools={tools} />
}
