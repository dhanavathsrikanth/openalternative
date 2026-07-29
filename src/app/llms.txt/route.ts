import { db } from '@/app/db'
import { Products, Comparisons, Collections } from '@/app/db/schema'
import { desc, eq, and, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const baseUrl = 'https://forklane.dev'

  const products = await db
    .select({ slug: Products.slug, name: Products.name, description: Products.description })
    .from(Products)
    .where(inArray(Products.status, ['published']))
    .orderBy(desc(Products.confidenceScore))
    .limit(100)

  const comparisonRows = await db
    .select({
      productASlug: Products.slug,
      productAName: Products.name,
    })
    .from(Comparisons)
    .innerJoin(Products, and(eq(Comparisons.productAId, Products.id), inArray(Products.status, ['published'])))
    .limit(50)

  const comparisonRowsB = await db
    .select({
      productBSlug: Products.slug,
      productBName: Products.name,
    })
    .from(Comparisons)
    .innerJoin(Products, and(eq(Comparisons.productBId, Products.id), inArray(Products.status, ['published'])))
    .limit(50)

  const comparisons = comparisonRows.map((row, i) => ({
    aSlug: row.productASlug,
    aName: row.productAName,
    bSlug: comparisonRowsB[i]?.productBSlug || '',
    bName: comparisonRowsB[i]?.productBName || '',
  }))

  const collections = await db
    .select({ slug: Collections.slug, title: Collections.title })
    .from(Collections)
    .limit(20)

  const lines: string[] = []
  lines.push('# Forklane')
  lines.push('')
  lines.push('> An open-source software discovery and comparison platform.')
  lines.push('> Find migration-ready alternatives, compare tools, and read expert guides.')
  lines.push('')
  lines.push('## Sections')
  lines.push('')
  lines.push('- [Homepage](https://forklane.dev/)')
  lines.push('- [Methodology](https://forklane.dev/methodology) – How migration confidence scores are calculated')
  lines.push('- [Products](https://forklane.dev/products) – Browse all open-source alternatives')
  lines.push('- [Compare](https://forklane.dev/compare) – Side-by-side tool comparisons')
  lines.push('- [Collections](https://forklane.dev/collections) – Curated product groupings')
  lines.push('- [The Graveyard](https://forklane.dev/graveyard) – Historical archive of delisted projects')
  lines.push('- [Contributors](https://forklane.dev/contributors) – Community leaderboard')
  lines.push('- [Guides](https://forklane.dev/guides) – Expert editorial content')
  lines.push('')
  lines.push('## Products (top 100 by confidence score)')
  lines.push('')

  for (const p of products) {
    lines.push(`- [${p.name}](https://forklane.dev/product/${p.slug}) – ${p.description}`)
  }

  lines.push('')
  lines.push('## Comparisons')
  lines.push('')

  for (const c of comparisons) {
    if (c.aSlug && c.bSlug) {
      lines.push(`- [${c.aName} vs ${c.bName}](https://forklane.dev/compare/${c.aSlug}-vs-${c.bSlug})`)
    }
  }

  lines.push('')
  lines.push('## Collections')
  lines.push('')

  for (const col of collections) {
    lines.push(`- [${col.title}](https://forklane.dev/collections/${col.slug})`)
  }

  lines.push('')
  lines.push('## About')
  lines.push('')
  lines.push('Forklane helps teams discover and evaluate open-source alternatives to proprietary software.')
  lines.push('Each product is scored on migration confidence based on activity, license, hosting complexity,')
  lines.push('data portability, and community health. See [methodology](https://forklane.dev/methodology) for details.')
  lines.push('')
  lines.push('## API')
  lines.push('')
  lines.push('- [Search API](https://forklane.dev/api/search?q=) – Search products by query')
  lines.push('')

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
