'use client'

import type { Product } from '@/app/db/schema'
import { useTranslations } from 'next-intl'
import { LicenseBadge } from '@/components/product/LicenseBadge'
import Link from 'next/link'

interface Props {
  tool: {
    id: number
    name: string
    slug: string
    url: string | null
  }
  products: Pick<Product, 'id' | 'name' | 'slug' | 'description' | 'license' | 'primaryLanguage' | 'stars' | 'forks' | 'githubUrl'>[]
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

export function AlternativesToPage({ tool, products }: Props) {
  const tCommon = useTranslations('Common')
  const tAlternatives = useTranslations('AlternativesTo')

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{tCommon('brand')}</Link>
        <span className="mx-2">/</span>
        <Link href="/categories" className="hover:text-foreground">{tAlternatives('breadcrumb.alternatives')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{tool.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">
          {tAlternatives('heading', { name: tool.name })}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {tAlternatives('description', { name: tool.name })}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {tAlternatives('count', { count: products.length })}
          </p>
          {tool.url && (
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand hover:underline"
            >
              {tAlternatives('visitWebsite')} →
            </a>
          )}
        </div>
      </header>

      {/* Products grid */}
      <section>
        <h2 className="mb-6 text-xl font-semibold">{tAlternatives('products.heading')}</h2>
        {products.length === 0 ? (
          <p className="text-muted-foreground">
            {tAlternatives('products.empty', { name: tool.name })}
          </p>
        ) : (
          <ul className="space-y-4">
            {products.map((p, i) => (
              <li key={p.id}>
                <Link
                   href={`/product/${p.slug}`}
                  className="block rounded-xl border bg-card p-6 shadow-sm transition-colors duration-fast ease-out hover:bg-accent card-lift"
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
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        {p.stars != null && (
                          <span className="inline-flex items-center gap-1">
                            <svg className="size-3.5 shrink-0 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                            {formatNumber(p.stars)}
                          </span>
                        )}
                        {p.forks != null && (
                          <span className="inline-flex items-center gap-1">
                            <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /><path d="M12 12v3" />
                            </svg>
                            {formatNumber(p.forks)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
