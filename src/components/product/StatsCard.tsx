'use client'

import type { Product } from '@/app/db/schema'
import { ProductCard } from '@/components/product/ProductCard'
import { formatStatNumber } from '@/lib/format'

interface Props {
  product: Product
  confidenceScore: number | null
}

function isSelfHosted(deploymentMethods: string[] | null): boolean {
  if (!deploymentMethods) return false
  return deploymentMethods.includes('docker') || deploymentMethods.includes('source')
}

function extractOwnerRepo(githubUrl: string): string | null {
  const match = githubUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/)
  return match ? match[1] : null
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

function repoAgeYears(firstReleaseYear: number | null | undefined): string {
  if (!firstReleaseYear) return '—'
  const years = Math.max(0, new Date().getFullYear() - firstReleaseYear)
  if (years === 0) return '<1y'
  if (years === 1) return '1 year'
  return `${years} years`
}

function getActivityLabel(score: number): { label: string; className: string } {
  if (score >= 80) return { label: 'Very Active', className: 'text-success' }
  if (score >= 60) return { label: 'Active', className: 'text-emerald-500' }
  if (score >= 40) return { label: 'Moderate', className: 'text-yellow-500' }
  if (score >= 20) return { label: 'Low', className: 'text-warning' }
  return { label: 'Inactive', className: 'text-destructive' }
}

export function StatsCard({ product, confidenceScore }: Props) {
  const activityScore = confidenceScore !== null ? Math.round(confidenceScore) : null
  const activity = activityScore !== null ? getActivityLabel(activityScore) : null
  const ownerRepo = product.githubUrl ? extractOwnerRepo(product.githubUrl) : null

  return (
    <ProductCard>
      <h2 className="mb-4 text-body-sm font-medium text-muted-foreground">Stats</h2>

      <div className="mb-4 flex items-center gap-3">
        {activityScore !== null ? (
          <>
            <span className={`text-3xl font-bold tabular-nums leading-none ${activity?.className ?? ''}`}>
              {activityScore}
            </span>
            <span className="text-body-sm text-muted-foreground">{activity?.label}</span>
          </>
        ) : (
          <span className="text-body-sm text-muted-foreground">Activity score not available</span>
        )}
      </div>

      <dl className="space-y-3 text-body-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Stars</dt>
          <dd className="font-medium tabular-nums">
            {product.stars != null ? formatStatNumber(product.stars) : '—'}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Forks</dt>
          <dd className="font-medium tabular-nums">
            {product.forks != null ? formatStatNumber(product.forks) : '—'}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Last commit</dt>
          <dd className="font-medium">
            {product.lastPushedAt ? timeAgo(product.lastPushedAt) : '—'}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Repository age</dt>
          <dd className="font-medium">{repoAgeYears(product.firstReleaseYear)}</dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Version</dt>
          <dd className="font-medium font-mono text-body-xs">
            {product.latestVersion ?? '—'}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">License</dt>
          <dd className="font-medium">{product.license ?? '—'}</dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Self-hosted</dt>
          <dd className="font-medium">
            {isSelfHosted(product.deploymentMethods) ? 'Yes' : 'No'}
          </dd>
        </div>

        {ownerRepo && product.githubUrl && (
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Repository</dt>
            <dd>
              <a
                href={product.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                {ownerRepo}
                <svg className="ml-1 inline-block size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 17L17 7M17 7H8M17 7v9" />
                </svg>
              </a>
            </dd>
          </div>
        )}
      </dl>
    </ProductCard>
  )
}