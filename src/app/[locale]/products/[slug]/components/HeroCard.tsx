'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import type { Product } from '@/app/db/schema'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicenseBadge } from '../LicenseBadge'
import { VerifiedBadge } from '../VerifiedBadge'
import { ProductHeaderActions } from '../ProductHeaderActions'
import { formatStatNumber } from '@/lib/format'

interface Props {
  product: Product
  logoUrl: string | null
  proprietaryTools: { id: number; name: string; url: string | null }[]
  isBookmarked: boolean
  isSignedIn: boolean
}

export function HeroCard({
  product,
  logoUrl,
  proprietaryTools,
  isBookmarked,
  isSignedIn,
}: Props) {
  const t = useTranslations('Product')
  const [lastPushedTimeAgo, setLastPushedTimeAgo] = useState<string>('')

  useEffect(() => {
    if (!product.lastPushedAt) return
    const diff = Date.now() - new Date(product.lastPushedAt).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) setLastPushedTimeAgo('today')
    else if (days === 1) setLastPushedTimeAgo('yesterday')
    else if (days < 30) setLastPushedTimeAgo(`${days}d ago`)
    else if (days < 365) setLastPushedTimeAgo(`${Math.floor(days / 30)}mo ago`)
    else setLastPushedTimeAgo(`${Math.floor(days / 365)}yr ago`)
  }, [product.lastPushedAt])

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-6 p-6 md:p-8">
        {/* Top row: identity + actions */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${product.name} logo`}
                className="size-16 flex-shrink-0 rounded-xl object-cover"
              />
            ) : (
              <div className="flex size-16 flex-shrink-0 items-center justify-center rounded-xl bg-secondary text-2xl font-bold text-muted-foreground">
                {product.name[0]}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                  {product.name}
                </h1>
                {product.claimedByOrgId !== null && <VerifiedBadge />}
              </div>
              <p className="mt-1 line-clamp-2 text-body-sm text-muted-foreground italic leading-relaxed md:text-body-lg">
                {product.tagline ?? product.description}
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1">
            <ProductHeaderActions
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              initialBookmarked={isBookmarked}
              isSignedIn={isSignedIn}
            />
          </div>
        </div>

        {/* Meta badges */}
        {(product.stars != null ||
          product.license ||
          product.primaryLanguage ||
          product.lastPushedAt) && (
          <div className="flex flex-wrap items-center gap-2">
            {product.stars != null && (
              <Badge variant="secondary" className="gap-1.5 px-2.5 py-1">
                <svg
                  className="size-3"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                {formatStatNumber(product.stars)}
              </Badge>
            )}
            {product.license && <LicenseBadge license={product.license} />}
            {product.primaryLanguage && (
              <Badge variant="secondary" className="px-2.5 py-1">
                {product.primaryLanguage}
              </Badge>
            )}
            {product.lastPushedAt && (
              <Badge variant="secondary" className="px-2.5 py-1">
                {t('hero.updated', { time: lastPushedTimeAgo || '...' })}
              </Badge>
            )}
          </div>
        )}

        {/* "Alternative to" line */}
        {proprietaryTools.length > 0 && (
          <p className="text-body-sm text-muted-foreground">
            <span className="font-medium text-foreground/80">
              {t('hero.alternativeTo')}
            </span>{' '}
            {proprietaryTools.map((tool, i) => (
              <span key={tool.id}>
                {tool.url ? (
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand underline-offset-2 hover:underline"
                  >
                    {tool.name}
                  </a>
                ) : (
                  <span className="font-medium text-foreground/80">
                    {tool.name}
                  </span>
                )}
                {i < proprietaryTools.length - 1 && (
                  <span className="text-muted-foreground">, </span>
                )}
              </span>
            ))}
          </p>
        )}

        {/* Primary action buttons */}
        {(product.homepageUrl || product.githubUrl) && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {product.homepageUrl && (
              <Button
                size="lg"
                nativeButton={false}
                render={
                  <a
                    href={product.homepageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                {t('hero.visitWebsite')}
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M7 17L17 7M17 7H8M17 7v9" />
                </svg>
              </Button>
            )}
            {product.githubUrl && (
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={
                  <a
                    href={product.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                {t('hero.viewGithubRepo')}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
