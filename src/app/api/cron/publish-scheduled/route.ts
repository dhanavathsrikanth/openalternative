import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products, ProductCategories, ProductTags, ProductAssets } from '@/app/db/schema'
import { eq, and, lte, sql } from 'drizzle-orm'
import { verifySecret, unauthorized } from '@/lib/cron-auth'
import { logAudit } from '@/lib/audit'
import { validatePublishable } from '@/lib/validation/product'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/cron/publish-scheduled
 *
 * Flips scheduled products to published once their publishAt timestamp
 * has passed. Runs every 15 minutes via Vercel cron.
 *
 * Protected by CRON_SECRET via Bearer token.
 */
export async function GET(req: NextRequest) {
  if (!verifySecret(req)) return unauthorized()

  const now = new Date()

  // Find all scheduled products whose publishAt is in the past
  const scheduled = await db
    .select()
    .from(Products)
    .where(
      and(
        eq(Products.status, 'scheduled'),
        lte(Products.publishAt, now),
      ),
    )

  let published = 0
  let skipped = 0
  const errors: string[] = []

  for (const product of scheduled) {
    try {
      // Run publish validation gate
      const [catRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(ProductCategories)
        .where(eq(ProductCategories.productId, product.id))

      const [tagRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(ProductTags)
        .where(eq(ProductTags.productId, product.id))

      const [logoRow] = await db
        .select({ url: ProductAssets.url })
        .from(ProductAssets)
        .where(eq(ProductAssets.productId, product.id))
        .limit(1)

      const errors = validatePublishable({
        name: product.name,
        slug: product.slug,
        tagline: product.tagline,
        description: product.description,
        logoUrl: logoRow?.url ?? null,
        categoryCount: catRow?.count ?? 0,
        tagCount: tagRow?.count ?? 0,
      })

      if (errors !== true) {
        // Not publishable — skip and leave as scheduled
        skipped++
        continue
      }

      await db
        .update(Products)
        .set({ status: 'published', updatedAt: now })
        .where(eq(Products.id, product.id))

      await logAudit('system', 'product.published', 'product', String(product.id), null, { slug: product.slug })

      revalidatePath(`/product/${product.slug}`)
      revalidatePath('/')

      // Revalidate category pages
      const catRows = await db
        .select({ slug: sql<string>`(SELECT slug FROM categories WHERE id = ${ProductCategories.categoryId})` })
        .from(ProductCategories)
        .where(eq(ProductCategories.productId, product.id))
      for (const row of catRows) {
        if (row.slug) revalidatePath(`/categories/${row.slug}`)
      }

      published++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[publish-scheduled] Error publishing product ${product.id}:`, msg)
      errors.push(`product ${product.id}: ${msg}`)
      skipped++
    }
  }

  return NextResponse.json({ published, skipped, errors })
}
