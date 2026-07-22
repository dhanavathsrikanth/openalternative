import { db } from '@/app/db'
import { Comparisons, Products } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export const revalidate = 86400 // 24h ISR

export default async function CompareIndexPage() {
  const rows = await db
    .select({
      id: Comparisons.id,
      slugA: Products.slug,
      nameA: Products.name,
    })
    .from(Comparisons)
    .innerJoin(Products, eq(Comparisons.productAId, Products.id))

  // We need productB info too
  const comparisons = await Promise.all(
    rows.map(async (r) => {
      const bRow = await db
        .select({ slug: Products.slug, name: Products.name })
        .from(Products)
        .where(eq(Products.id, r.id))
        .limit(1)
      return { ...r, slugB: bRow[0]?.slug ?? '', nameB: bRow[0]?.name ?? '' }
    }),
  )

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Comparisons</h1>

      {comparisons.length === 0 ? (
        <p className="text-muted-foreground">
          No comparisons have been generated yet. Check back soon!
        </p>
      ) : (
        <ul className="space-y-4">
          {comparisons.map((c) => {
            const slugA = c.slugA
            const slugB = c.slugB
            const canonical = slugA < slugB ? `${slugA}-vs-${slugB}` : `${slugB}-vs-${slugA}`
            return (
              <li key={c.id}>
                <Link
                  href={`/compare/${canonical}`}
                  className="block rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent"
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
