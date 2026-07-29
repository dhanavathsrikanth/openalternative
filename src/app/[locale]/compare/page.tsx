import { db } from '@/app/db'
import { Comparisons, Products } from '@/app/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export const revalidate = 86400 // 24h ISR

export default async function CompareIndexPage() {
  const t = await getTranslations('CompareIndex')

  const rows = await db
    .select({
      id: Comparisons.id,
      productAId: Comparisons.productAId,
      productBId: Comparisons.productBId,
      slugA: Products.slug,
      nameA: Products.name,
    })
    .from(Comparisons)
    .innerJoin(Products, eq(Comparisons.productAId, Products.id))
    .where(inArray(Products.status, ['published']))

  // We need productB info too
  const comparisons = await Promise.all(
    rows.map(async (r) => {
      const bRow = await db
        .select({ slug: Products.slug, name: Products.name })
        .from(Products)
        .where(and(eq(Products.id, r.productBId), inArray(Products.status, ['published'])))
        .limit(1)
      return { ...r, slugB: bRow[0]?.slug ?? '', nameB: bRow[0]?.name ?? '' }
    }),
  )

  // Filter out comparisons where productB wasn't found (unpublished)
  const validComparisons = comparisons.filter((c) => c.slugB)

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">{t('heading')}</h1>

      {validComparisons.length === 0 ? (
        <p className="text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <ul className="space-y-4">
          {validComparisons.map((c) => {
            const slugA = c.slugA
            const slugB = c.slugB
            const canonical = slugA < slugB ? `${slugA}-vs-${slugB}` : `${slugB}-vs-${slugA}`
            return (
              <li key={c.id}>
                <Link
                  href={`/compare/${canonical}`}
                  className="block rounded-xl border bg-card p-6 shadow-sm transition-colors duration-fast ease-out hover:bg-accent card-lift"
                >
                  <h2 className="text-lg font-semibold">
                    {c.nameA} vs {c.nameB}
                  </h2>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
