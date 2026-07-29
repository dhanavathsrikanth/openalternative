'use client'

import { useState } from 'react'
import { BlockRenderer } from './BlockRenderer'
import type { Product } from '@/app/db/schema'

interface ContentPreviewProps {
  product: Product | undefined
  blocks: unknown[]
  logoUrl?: string | null
}

type ViewportSize = 'desktop' | 'mobile'

const VIEWPORT_WIDTHS: Record<ViewportSize, string> = {
  desktop: '100%',
  mobile: '375px',
}

export function ContentPreview({ product, blocks, logoUrl }: ContentPreviewProps) {
  const [viewport, setViewport] = useState<ViewportSize>('desktop')

  const name = product?.name ?? 'Product Name'
  const tagline = product?.tagline ?? ''
  const description = product?.description ?? ''
  const stars = product?.stars ?? null
  const forks = product?.forks ?? null

  function formatStat(n: number | null): string {
    if (n == null || n === 0) return '0'
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
    return n.toLocaleString()
  }

  return (
    <div className="space-y-4">
      {/* ── Viewport toggle ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Live preview — updates as you edit
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewport === 'desktop'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              viewport === 'mobile'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            Mobile
          </button>
        </div>
      </div>

      {/* ── Preview frame ────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <div
          className="overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all duration-300"
          style={{ width: VIEWPORT_WIDTHS[viewport] }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
            {/* ── Hero area (simplified product page header) ─────────── */}
            <div className="border-b bg-card px-6 py-5">
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt={`${name} logo`}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{name}</h1>
                  {tagline && (
                    <p className="mt-0.5 text-sm text-muted-foreground italic">{tagline}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {description && (
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{description}</p>
              )}

              {/* Stat strip */}
              {(stars != null || forks != null) && (
                <div className="mt-3 flex gap-2">
                  {stars != null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-secondary/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                      <svg className="size-3.5 shrink-0 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="font-medium uppercase tracking-wide">Stars</span>
                      <span className="tabular-nums">{formatStat(stars)}</span>
                    </span>
                  )}
                  {forks != null && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-secondary/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                      <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" />
                        <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /><path d="M12 12v3" />
                      </svg>
                      <span className="font-medium uppercase tracking-wide">Forks</span>
                      <span className="tabular-nums">{formatStat(forks)}</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* ── Content blocks ─────────────────────────────────────── */}
            <div className="px-6 py-5">
              <BlockRenderer blocks={blocks} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
