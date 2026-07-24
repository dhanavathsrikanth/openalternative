'use client'

import type { Product } from '@/app/db/schema'

interface Props {
  product: Product
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function GithubStats({ product }: Props) {
  const stars = product.stars ?? 0
  const forks = product.forks ?? 0
  const openIssues = product.openIssues ?? 0
  const language = product.primaryLanguage
  const lastPushedAt = product.lastPushedAt

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">
        GitHub Stats
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <span className="block text-2xl font-bold tabular-nums">
            {formatNumber(stars)}
          </span>
          <span className="text-xs text-muted-foreground">Stars</span>
        </div>
        <div>
          <span className="block text-2xl font-bold tabular-nums">
            {formatNumber(forks)}
          </span>
          <span className="text-xs text-muted-foreground">Forks</span>
        </div>
        <div>
          <span className="block text-2xl font-bold tabular-nums">
            {formatNumber(openIssues)}
          </span>
          <span className="text-xs text-muted-foreground">Issues</span>
        </div>
        <div>
          <span className="block text-2xl font-bold">
            {language ?? '—'}
          </span>
          <span className="text-xs text-muted-foreground">Language</span>
        </div>
      </div>
      {lastPushedAt && (
        <p className="mt-4 text-xs text-muted-foreground">
          Last push: {timeAgo(lastPushedAt)}
        </p>
      )}
      {product.topics && product.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.topics.slice(0, 5).map((topic) => (
            <span
              key={topic}
              className="inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
            >
              {topic}
            </span>
          ))}
          {product.topics.length > 5 && (
            <span className="text-[10px] text-muted-foreground">
              +{product.topics.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}
