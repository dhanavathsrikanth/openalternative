'use client'

import type { Category } from '@/app/db/schema'
import Link from 'next/link'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard } from '@/components/ProductCard'
import { CategoryCard } from '@/components/CategoryCard'
import { EmptyState } from '@/components/EmptyState'
import posthog from 'posthog-js'
import { HeroNewsletter } from '@/app/components/HeroNewsletter'
import { FaqSection } from '@/app/components/FaqSection'

interface CategoryItem {
  id: number
  name: string
  slug: string
  description: string | null
  productCount: number
}

interface TrendingProduct {
  id: number
  name: string
  slug: string
  description: string
  tagline: string | null
  license: string | null
  primaryLanguage: string | null
  confidenceScore: string | null
  stars: number | null
  forks: number | null
  tags: string[]
}

interface Props {
  trending: TrendingProduct[]
  categories: CategoryItem[]
  recent: TrendingProduct[]
  productCount: number
  latestVerifiedAt: Date | null
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 30) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function Homepage({ trending, categories, recent, productCount, latestVerifiedAt }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      posthog.capture('homepage_searched', { query: query.trim() })
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const verifiedLabel = latestVerifiedAt
    ? `updated ${formatRelativeDate(new Date(latestVerifiedAt))}`
    : null

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 pb-16 pt-20 text-center sm:pb-20 sm:pt-24">
          {/* Live stat badge */}
          {productCount > 0 && (
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
              <span className="inline-block size-1.5 rounded-full bg-green-500" />
              Now tracking {productCount.toLocaleString()} open-source alternatives
              {verifiedLabel && <span className="text-muted-foreground/60"> · {verifiedLabel}</span>}
            </div>
          )}

          {/* Headline */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Find your next
            <br />
            <span className="text-primary">open-source alternative</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground sm:mt-5">
            Every listing is backed by live GitHub and npm data — verified
            timestamps, real activity signals, and transparent confidence
            scores. No guesswork.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mx-auto mt-8 max-w-xl sm:mt-10">
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for tools, frameworks, licenses..."
                className="w-full rounded-xl border bg-background py-3 pl-10 pr-24 text-sm outline-none ring-ring transition-shadow focus:ring-2"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Search
              </button>
            </div>
          </form>

          <p className="mt-3 text-xs text-muted-foreground">
            Powered by Postgres full-text search — instant results, no tracking
          </p>

          {/* Inline newsletter */}
          <div className="mx-auto mt-10 max-w-sm sm:mt-12">
            <HeroNewsletter />
          </div>
        </div>
      </section>

      {/* Trending alternatives */}
      <section className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Trending Alternatives</h2>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </div>

        {trending.length === 0 ? (
          <EmptyState
            icon={
              <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                <ProductCard product={p} stars={p.stars} forks={p.forks} tags={p.tags} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Popular categories */}
      <section className="border-t bg-card">
        <div className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Popular Categories</h2>
            <Link href="/categories" className="text-sm text-muted-foreground hover:text-foreground">
              All categories →
            </Link>
          </div>

          {categories.length === 0 ? (
            <EmptyState
              icon={
                <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <section className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12">
        <h2 className="mb-6 text-2xl font-semibold">Recently Updated</h2>

        {recent.length === 0 ? (
          <EmptyState
            icon={
              <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
                <ProductCard product={p} stars={p.stars} forks={p.forks} tags={p.tags} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* FAQ */}
      <FaqSection />

    </main>
  )
}
