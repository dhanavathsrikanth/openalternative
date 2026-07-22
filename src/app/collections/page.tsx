import { db } from '@/app/db'
import { Collections, CollectionProducts } from '@/app/db/schema'
import { eq, sql } from 'drizzle-orm'
import Link from 'next/link'

export const revalidate = 86400 // 24h ISR

export default async function CollectionsIndexPage() {
  const collections = await db
    .select({
      id: Collections.id,
      title: Collections.title,
      slug: Collections.slug,
      description: Collections.description,
      curationType: Collections.curationType,
      productCount: sql<number>`count(${CollectionProducts.productId})::int`,
    })
    .from(Collections)
    .leftJoin(CollectionProducts, eq(Collections.id, CollectionProducts.collectionId))
    .groupBy(Collections.id)
    .orderBy(sql`count(${CollectionProducts.productId}) DESC`)

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Forklane</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Collections</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">Collections</h1>

      {collections.length === 0 ? (
        <p className="text-muted-foreground">No collections yet.</p>
      ) : (
        <ul className="space-y-4">
          {collections.map((c) => (
            <li key={c.id}>
              <Link
                href={`/collections/${c.slug}`}
                className="block rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold">{c.title}</h2>
                    {c.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-medium tabular-nums">
                      {c.productCount} product{c.productCount !== 1 ? 's' : ''}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {c.curationType === 'manual' ? 'Manual' : 'Score-assisted'}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
