'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LicenseBadge } from '@/components/product/LicenseBadge'

interface Product {
  id: number
  name: string
  slug: string
  description: string
  tagline: string | null
  license: string | null
  primaryLanguage: string | null
  stars: number | null
  forks: number | null
  githubUrl: string | null
  homepageUrl: string | null
  delistReason: string | null
  delistedAt: Date | null
  updatedAt: Date
  logoUrl: string | null
}

interface Props {
  products: Product[]
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

function formatDate(d: Date | null): string | null {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function GraveyardPage({ products }: Props) {
  const tCommon = useTranslations('Common')
  const tGraveyard = useTranslations('Graveyard')

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      {/* Header */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{tCommon('brand')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{tGraveyard('breadcrumb')}</span>
      </nav>

      <header className="mb-10 border-b border-dashed pb-8">
        <h1 className="text-4xl font-bold tracking-tight text-muted-foreground">
          {tGraveyard('heading')}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground/80">
          {tGraveyard('description')}
        </p>
        <p className="mt-2 text-sm text-muted-foreground/60">
          {tGraveyard('count', { count: products.length })}
        </p>
      </header>

      {products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-muted-foreground/60">
            {tGraveyard('empty')}
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            {tGraveyard('browseActive')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                 href={`/product/${p.slug}`}
                className="group block rounded-xl border border-dashed border-muted-foreground/20 bg-muted/20 p-6 transition-colors hover:border-muted-foreground/40 hover:bg-muted/40"
              >
                <div className="flex items-start gap-4">
                  {p.logoUrl && (
                    <img
                      src={p.logoUrl}
                      alt={`${p.name} logo`}
                      className="h-10 w-10 shrink-0 rounded-lg object-cover opacity-60 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                        {p.name}
                      </h2>
                      {p.license && <LicenseBadge license={p.license} />}
                      {p.primaryLanguage && (
                        <span className="text-xs text-muted-foreground/60">{p.primaryLanguage}</span>
                      )}
                    </div>
                    {p.tagline && (
                      <p className="mt-1 text-sm italic text-muted-foreground/60">
                        {p.tagline}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground/70">
                      {p.description}
                    </p>

                    {/* Delist info */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground/50">
                      {p.delistReason && (
                        <span>
                          {tGraveyard('reason')} <span className="text-muted-foreground/70">{p.delistReason}</span>
                        </span>
                      )}
                      {p.delistedAt && (
                        <span>
                          {tGraveyard('delistedDate', { date: formatDate(p.delistedAt) ?? '' })}
                        </span>
                      )}
                    </div>

                    {/* Last-known stats */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground/50">
                      {p.stars != null && (
                        <span className="inline-flex items-center gap-1">
                          <svg className="size-3.5 shrink-0 text-yellow-600/50" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {formatNumber(p.stars)}
                        </span>
                      )}
                      {p.forks != null && (
                        <span className="inline-flex items-center gap-1">
                          <svg className="size-3.5 shrink-0 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /><path d="M12 12v3" />
                          </svg>
                          {formatNumber(p.forks)}
                        </span>
                      )}
                      <span className="text-muted-foreground/40">
                        {tGraveyard('lastUpdated', { date: formatDate(p.updatedAt) ?? '' })}
                      </span>
                    </div>
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
