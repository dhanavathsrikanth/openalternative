'use client'

import type { Product } from '@/app/db/schema'
import { useTranslations } from 'next-intl'
import { ProductCard } from '@/components/product/ProductCard'
import { formatStatNumber } from '@/lib/format'

interface Props {
  product: Product
}

function timeAgo(date: Date, t: ReturnType<typeof useTranslations>): string {
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return t('github.time.today')
  if (days === 1) return t('github.time.yesterday')
  if (days < 30) return t('github.time.daysAgo', { count: days })
  if (days < 365) return t('github.time.monthsAgo', { count: Math.floor(days / 30) })
  return t('github.time.yearsAgo', { count: Math.floor(days / 365) })
}

function extractOwnerRepo(githubUrl: string): string | null {
  const match = githubUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/)
  return match ? match[1] : null
}

export function RepositoryStats({ product }: Props) {
  const t = useTranslations('Product')
  const ownerRepo = product.githubUrl ? extractOwnerRepo(product.githubUrl) : null

  return (
    <ProductCard>
      <h2 className="mb-4 text-body-sm font-medium text-muted-foreground">
        {t('sidebar.repoStats')}
      </h2>

      <dl className="space-y-3 text-body-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('sidebar.stars')}</dt>
          <dd className="font-medium tabular-nums">
            {product.stars != null ? formatStatNumber(product.stars) : '—'}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('sidebar.forks')}</dt>
          <dd className="font-medium tabular-nums">
            {product.forks != null ? formatStatNumber(product.forks) : '—'}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('sidebar.license')}</dt>
          <dd className="font-medium">{product.license ?? '—'}</dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('sidebar.lastCommit')}</dt>
          <dd className="font-medium">
            {product.lastPushedAt ? timeAgo(product.lastPushedAt, t) : '—'}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('sidebar.lastVerified')}</dt>
          <dd className="font-medium">
            {product.lastVerifiedAt
              ? new Date(product.lastVerifiedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : '—'}
          </dd>
        </div>

        {ownerRepo && product.githubUrl && (
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">{t('sidebar.repository')}</dt>
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
