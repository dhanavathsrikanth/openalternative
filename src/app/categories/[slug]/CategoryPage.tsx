'use client'

import type { Category, Product, Comparison } from '@/app/db/schema'
import { LicenseBadge } from '@/app/products/[slug]/LicenseBadge'
import { ConfidenceGauge } from '@/app/products/[slug]/ConfidenceGauge'
import Link from 'next/link'

interface Props {
  category: Category
  products: Pick<Product, 'id' | 'name' | 'slug' | 'description' | 'license' | 'primaryLanguage' | 'deploymentMethods' | 'confidenceScore' | 'githubUrl'>[]
  comparisons: {
    id: number
    productAId: number
    productBId: number
    nameA: string
    slugA: string
    nameB: string
    slugB: string
    generatedAt: Date
  }[]
}

function canonicalSlug(a: string, b: string): string {
  return a < b ? `${a}-vs-${b}` : `${b}-vs-${a}`
}

export function CategoryPage({ category, products, comparisons }: Props) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Forklane</Link>
        <span className="mx-2">/</span>
        <Link href="/categories" className="hover:text-foreground">Categories</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">{category.name}</h1>
        {category.description && (
          <p className="mt-3 text-lg text-muted-foreground">{category.description}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {products.length} product{products.length !== 1 ? 's' : ''} ranked by migration confidence
        </p>
      </header>

      {/* Products grid */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-semibold">Products</h2>
        {products.length === 0 ? (
          <p className="text-muted-foreground">No products in this category yet.</p>
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
      </section>

      {/* Comparisons */}
      {comparisons.length > 0 && (
        <section>
          <h2 className="mb-6 text-xl font-semibold">Comparisons</h2>
          <ul className="space-y-3">
            {comparisons.map((c) => {
              const linkSlug = canonicalSlug(c.slugA, c.slugB)
              return (
                <li key={c.id}>
                  <Link
                    href={`/compare/${linkSlug}`}
                    className="block rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
                  >
                    <h3 className="font-medium">
                      {c.nameA} vs {c.nameB}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Generated {c.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </main>
  )
}
