'use client'

import type { Collection, Product } from '@/app/db/schema'
import { LicenseBadge } from '@/app/products/[slug]/LicenseBadge'
import Link from 'next/link'

interface Props {
  collection: Collection
  products: Pick<Product, 'id' | 'name' | 'slug' | 'description' | 'license' | 'primaryLanguage' | 'deploymentMethods' | 'confidenceScore' | 'githubUrl'>[]
}

export function CollectionPage({ collection, products }: Props) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Forklane</Link>
        <span className="mx-2">/</span>
        <Link href="/collections" className="hover:text-foreground">Collections</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{collection.title}</span>
      </nav>

      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">{collection.title}</h1>
        {collection.description && (
          <p className="mt-3 text-lg text-muted-foreground">{collection.description}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {products.length} product{products.length !== 1 ? 's' : ''} ·{' '}
          {collection.curationType === 'manual' ? 'Manually curated' : 'Score-assisted'}
        </p>
      </header>

      {products.length === 0 ? (
        <p className="text-muted-foreground">No products in this collection yet.</p>
      ) : (
        <ul className="space-y-4">
          {products.map((p, i) => {
            const score = p.confidenceScore ? parseFloat(p.confidenceScore) : null
            return (
              <li key={p.id}>
                <Link
                  href={`/products/${p.slug}`}
                  className="block rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold">{p.name}</h3>
                        {p.license && <LicenseBadge license={p.license} />}
                        {p.primaryLanguage && (
                          <span className="text-xs text-muted-foreground">{p.primaryLanguage}</span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {p.description}
                      </p>
                    </div>
                    {score !== null && (
                      <div className="shrink-0">
                        <span className="text-2xl font-bold tabular-nums">{Math.round(score)}</span>
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
