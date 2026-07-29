'use client'

import Link from 'next/link'
import type { Product } from '@/app/db/schema'
import { BookmarkButton } from '@/components/BookmarkButton'
import { useTranslations } from 'next-intl'

interface Props {
  product: Pick<Product, 'id' | 'name' | 'slug' | 'description' | 'tagline' | 'license' | 'primaryLanguage' | 'confidenceScore'>
  logoUrl?: string | null
  stars?: number | null
  forks?: number | null
  tags?: string[]
  topics?: string[]
  /** When provided, renders a bookmark toggle button on the card */
  bookmarked?: boolean
}

function formatStat(n: number | null | undefined): string {
  if (n == null || n === 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toLocaleString()
}

export function ProductCard({ product, logoUrl, stars, forks, tags, topics, bookmarked }: Props) {
  const t = useTranslations('Common')
  const displayTags = tags?.slice(0, 3) ?? []
  const overflowCount = (tags?.length ?? 0) - 3
  const displayTopics = topics?.slice(0, 2) ?? []

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-card-border bg-card p-5 transition-colors duration-fast ease-out hover:bg-accent/50 card-lift"
    >
      {/* Logo + Name + Bookmark */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${product.name} logo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          )}
        </div>
        <h3 className="truncate text-lg font-semibold text-foreground">
          {product.name}
        </h3>
        {bookmarked !== undefined && (
          <div className="ml-auto shrink-0">
            <BookmarkButton
              productId={product.id}
              initialBookmarked={bookmarked}
              stopPropagation
            />
          </div>
        )}
      </div>

      {/* Stat row — stars & forks */}
      <div className="mb-3 flex gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-secondary/50 px-2.5 py-0.5 text-xs text-muted-foreground">
          <svg className="size-3.5 shrink-0 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="font-medium uppercase tracking-wide">{t('stat.stars')}</span>
          <span className="tabular-nums">{formatStat(stars)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-secondary/50 px-2.5 py-0.5 text-xs text-muted-foreground">
          <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
            <path d="M12 12v3" />
          </svg>
          <span className="font-medium uppercase tracking-wide">{t('stat.forks')}</span>
          <span className="tabular-nums">{formatStat(forks)}</span>
        </span>
      </div>

      {/* Tagline — short punchy line, clamped for safety */}
      {product.tagline && (
        <p className="mb-2 line-clamp-2 text-sm font-medium text-foreground/80">
          {product.tagline}
        </p>
      )}

      {/* Description */}
      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {product.description}
      </p>

      {/* Tag chips — pushed to bottom */}
      {displayTags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-card-border bg-secondary/30 px-2 py-0.5 text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-card-border bg-secondary/30 px-2 py-0.5 text-xs text-muted-foreground">
              +{overflowCount}
            </span>
          )}
        </div>
      )}

      {/* GitHub topics — shown if no tags */}
      {displayTags.length === 0 && displayTopics.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5">
          {displayTopics.map((topic) => (
            <span
              key={topic}
              className="inline-flex items-center rounded-full bg-secondary/50 px-2 py-0.5 text-xs text-secondary-foreground"
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
