import Link from 'next/link'
import { formatStatNumber } from '@/lib/format'

export interface FeaturedTool {
  id: number
  name: string
  slug: string
  /** One-line description shown under the name */
  description: string
  /** URL to the logo asset (null = show fallback) */
  logoUrl: string | null
  /** Whether the product is claimed (shows verified badge) */
  isClaimed: boolean
  stars: number | null
  forks: number | null
  lastPushedAt: Date | null
}

// ── helpers ────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}yr ago`
}

// ── sub-components ─────────────────────────────────────────────────────────

function Logo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="h-9 w-9 shrink-0 rounded-lg object-cover"
      />
    )
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
      {name[0]}
    </div>
  )
}

function VerifiedBadge() {
  return (
    <span className="shrink-0 text-success" title="Verified">
      {/* Heroicons solid badge-check – same SVG used in ProductPage hero */}
      <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-label="Verified">
        <path
          fillRule="evenodd"
          d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  )
}

// ── main card ──────────────────────────────────────────────────────────────

/**
 * A featured-tool card used in the "Featured Tools" sidebar section.
 *
 * Stat block uses *plain label-left / value-right rows* (not pill badges),
 * matching the RepositoryStats sidebar style exactly.
 */
export function FeaturedToolCard({ tool }: { tool: FeaturedTool }) {
  return (
    <Link
      href={`/product/${tool.slug}`}
      className="group block rounded-xl border border-border-default bg-surface-raised p-3.5 shadow-elevation-1 transition-colors hover:bg-accent/40"
    >
      {/* Logo + name row */}
      <div className="mb-2.5 flex items-center gap-2.5 min-w-0">
        <Logo name={tool.name} logoUrl={tool.logoUrl} />
        <span className="min-w-0 flex-1 truncate text-body-sm font-semibold text-foreground group-hover:underline">
          {tool.name}
        </span>
        {tool.isClaimed && <VerifiedBadge />}
      </div>

      {/* One-line description */}
      <p className="mb-3 line-clamp-1 text-body-xs leading-snug text-muted-foreground">
        {tool.description}
      </p>

      {/* Stat block — plain label-left / value-right rows (no pill badges) */}
      <dl className="space-y-1.5 text-body-xs">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Stars</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {tool.stars != null ? formatStatNumber(tool.stars) : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Forks</dt>
          <dd className="font-medium tabular-nums text-foreground">
            {tool.forks != null ? formatStatNumber(tool.forks) : '—'}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Last commit</dt>
          <dd className="font-medium text-foreground">
            {tool.lastPushedAt ? timeAgo(tool.lastPushedAt) : '—'}
          </dd>
        </div>
      </dl>
    </Link>
  )
}
