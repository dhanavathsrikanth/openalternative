import { db } from '@/app/db'
import { Products } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export const revalidate = 86400 // 24h ISR

export default async function ProductsPage() {
  const products = await db
    .select()
    .from(Products)
    .where(eq(Products.status, 'published'))

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Products</h1>

      {products.length === 0 ? (
        <p className="text-muted-foreground">
          No products have been published yet. Check back soon!
        </p>
      ) : (
        <ul className="space-y-4">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/products/${p.slug}`}
                className="block rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold">{p.name}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  </div>
                  {p.confidenceScore && (
                    <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-medium tabular-nums">
                      {Math.round(parseFloat(p.confidenceScore))}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {p.primaryLanguage && <span>{p.primaryLanguage}</span>}
                  {p.license && <span>• {p.license}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
