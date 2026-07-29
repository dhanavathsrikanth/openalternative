'use client'

import type { Product } from '@/app/db/schema'
import { useTranslations } from 'next-intl'
import { ProductCard } from '@/components/product/ProductCard'
import { formatStatNumber } from '@/lib/format'

interface Props {
  product: Product
}

function isSelfHosted(deploymentMethods: string[] | null): boolean {
  if (!deploymentMethods) return false
  return deploymentMethods.includes('docker') || deploymentMethods.includes('source')
}

export function AdditionalDetails({ product }: Props) {
  const t = useTranslations('Product')

  return (
    <ProductCard>
      <h2 className="mb-4 text-body-sm font-medium text-muted-foreground">
        {t('sidebar.additionalDetails')}
      </h2>

      <dl className="space-y-3 text-body-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('sidebar.primaryLanguage')}</dt>
          <dd className="font-medium">{product.primaryLanguage ?? '—'}</dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('sidebar.openIssues')}</dt>
          <dd className="font-medium tabular-nums">
            {product.openIssues != null ? formatStatNumber(product.openIssues) : '—'}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('sidebar.contributors')}</dt>
          <dd className="font-medium tabular-nums">
            {product.contributorsCount != null ? formatStatNumber(product.contributorsCount) : '—'}
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('sidebar.firstRelease')}</dt>
          <dd className="font-medium">{product.firstReleaseYear ?? '—'}</dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('sidebar.version')}</dt>
          <dd className="font-medium font-mono text-body-xs">{product.latestVersion ?? '—'}</dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">{t('sidebar.selfHosted')}</dt>
          <dd className="font-medium">
            {isSelfHosted(product.deploymentMethods) ? t('sidebar.yes') : t('sidebar.no')}
          </dd>
        </div>
      </dl>
    </ProductCard>
  )
}
