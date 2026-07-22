/**
 * scripts/generate-comparisons.ts
 *
 * Precomputes feature-matrix comparisons for every same-category product pair
 * and stores them in the `comparisons` table.  Run via:
 *
 *   npx tsx scripts/generate-comparisons.ts
 *
 * Uses the Neon `dev` branch (.env.local DATABASE_URL).
 */

import { db } from '../src/app/db'
import { Products, ProductCategories, Comparisons } from '../src/app/db/schema'
import { eq, and, lt } from 'drizzle-orm'

interface FeatureRow {
  label: string
  a: string | number | null
  b: string | number | null
}

function scoreLabel(score: string | null): string {
  if (!score) return '—'
  const n = Math.round(parseFloat(score))
  if (n >= 80) return `${n} (High)`
  if (n >= 60) return `${n} (Good)`
  if (n >= 40) return `${n} (Moderate)`
  return `${n} (Low)`
}

function licenseCompare(a: string | null, b: string | null): string {
  if (a === b) return 'Same'
  if (!a) return 'B has license, A does not'
  if (!b) return 'A has license, B does not'
  return `${a} vs ${b}`
}

function buildFeatureMatrix(a: typeof Products.$inferSelect, b: typeof Products.$inferSelect): FeatureRow[] {
  return [
    { label: 'License', a: a.license, b: b.license },
    { label: 'Language', a: a.primaryLanguage, b: b.primaryLanguage },
    { label: 'Confidence Score', a: scoreLabel(a.confidenceScore), b: scoreLabel(b.confidenceScore) },
    { label: 'Deployment', a: a.deploymentMethods?.join(', ') ?? '—', b: b.deploymentMethods?.join(', ') ?? '—' },
    { label: 'License Comparison', a: licenseCompare(a.license, b.license), b: licenseCompare(b.license, a.license) },
  ]
}

async function main() {
  console.log('Generating same-category product comparisons...\n')

  // 1. Get all published products with their category IDs
  const productsWithCats = await db
    .select({
      product: Products,
      categoryId: ProductCategories.categoryId,
    })
    .from(Products)
    .innerJoin(ProductCategories, eq(Products.id, ProductCategories.productId))
    .where(eq(Products.status, 'published'))

  // 2. Group products by category
  const byCategory = new Map<number, typeof productsWithCats>()
  for (const row of productsWithCats) {
    const list = byCategory.get(row.categoryId) ?? []
    list.push(row)
    byCategory.set(row.categoryId, list)
  }

  // 3. Generate pairs (canonical order: smaller ID first)
  const pairs: [typeof Products.$inferSelect, typeof Products.$inferSelect][] = []
  const seenPairs = new Set<string>()

  for (const items of byCategory.values()) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i].product
        const b = items[j].product
        const key = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`
        if (!seenPairs.has(key)) {
          seenPairs.add(key)
          pairs.push(a.id < b.id ? [a, b] : [b, a])
        }
      }
    }
  }

  if (pairs.length === 0) {
    console.log('No same-category product pairs found. Add products to categories first.')
    process.exit(0)
  }

  console.log(`Found ${pairs.length} unique product pair(s) to compare.\n`)

  let created = 0
  let updated = 0

  for (const [a, b] of pairs) {
    const featureMatrix = buildFeatureMatrix(a, b)

    // Check if comparison already exists
    const existing = await db
      .select({ id: Comparisons.id })
      .from(Comparisons)
      .where(
        and(
          eq(Comparisons.productAId, a.id),
          eq(Comparisons.productBId, b.id),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      // Update existing comparison
      await db
        .update(Comparisons)
        .set({
          featureMatrix,
          generatedAt: new Date(),
        })
        .where(eq(Comparisons.id, existing[0].id))
      updated++
      console.log(`  Updated: ${a.name} vs ${b.name}`)
    } else {
      // Insert new comparison
      await db.insert(Comparisons).values({
        productAId: a.id,
        productBId: b.id,
        featureMatrix,
      })
      created++
      console.log(`  Created: ${a.name} vs ${b.name}`)
    }
  }

  console.log(`\nDone! Created ${created}, updated ${updated} comparison(s).`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
