'use client'

import type { Product, Category } from '@/app/db/schema'
import Link from 'next/link'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from '@/components/ProductCard'
import { CategoryCard } from '@/components/CategoryCard'
import { EmptyState } from '@/components/EmptyState'

interface CategoryItem {
  id: number
  name: string
  slug: string
  description: string | null
  productCount: number
}

interface Props {
  trending: Pick<Product, 'id' | 'name' | 'slug' | 'description' | 'license' | 'primaryLanguage' | 'confidenceScore'>[]
  categories: CategoryItem[]
  recent: Pick<Product, 'id' | 'name' | 'slug' | 'description' | 'license' | 'primaryLanguage' | 'confidenceScore' | 'updatedAt'>[]
}

export function Homepage({ trending, categories, recent }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-16 text-center sm:pb-16 sm:pt-20">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Find your next
            <br />
            <span className="text-muted-foreground">open-source alternative</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground sm:mt-4">
            Discover, compare, and migrate to open-source software with confidence
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mx-auto mt-6 max-w-xl sm:mt-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for tools, frameworks, libraries..."
                className="flex-1 rounded-lg border bg-background px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
              />
              <button
                type="submit"
                className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Search
              </button>
            </div>
          </form>

          <p className="mt-3 text-xs text-muted-foreground sm:mt-4">
            Powered by Postgres full-text search — instant results, no tracking
          </p>
        </div>
      </section>

      {/* Trending alternatives */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Trending Alternatives</h2>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </div>

        {trending.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
            title="No products published yet"
            description="Products will appear here once they've been ingested and scored. Check back soon!"
            action={{ label: 'Learn how scoring works', href: '/methodology' }}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trending.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Popular categories */}
      <section className="border-t bg-card">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Popular Categories</h2>
            <Link href="/categories" className="text-sm text-muted-foreground hover:text-foreground">
              All categories →
            </Link>
          </div>

          {categories.length === 0 ? (
            <EmptyState
              icon={
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              }
              title="No categories yet"
              description="Categories are created as products are ingested. Check back soon!"
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <li key={c.id}>
                  <CategoryCard category={c} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Recently updated */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-semibold">Recently Updated</h2>

        {recent.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
            title="No recent updates"
            description="Product updates will appear here as they're processed."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="mx-auto max-w-5xl px-4 py-8 text-center text-sm text-muted-foreground">
          <p>Forklane — Open-source software discovery platform</p>
          <p className="mt-1">
            <Link href="/products" className="hover:text-foreground">Products</Link>
            {' · '}
            <Link href="/categories" className="hover:text-foreground">Categories</Link>
            {' · '}
            <Link href="/compare" className="hover:text-foreground">Comparisons</Link>
          </p>
        </div>
      </footer>
    </main>
  )
}
