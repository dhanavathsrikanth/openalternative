'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { BookmarkButton } from '@/components/BookmarkButton'
import { ConfidenceGauge } from '../ConfidenceGauge'
import { DeploymentMethods } from '../DeploymentMethods'
import { RepositoryStats } from '../RepositoryStats'
import { AdditionalDetails } from '../AdditionalDetails'
import { SuggestEditForm } from '../SuggestEditForm'
import { ReportForm } from '../ReportForm'
import { ClaimForm } from '../ClaimForm'
import Link from 'next/link'
import type { Product } from '@/app/db/schema'

interface Props {
  product: Product
  categories: { name: string; slug: string }[]
  tags: { name: string; slug: string }[]
  isBookmarked: boolean
  isSignedIn: boolean
  currentOrgId: string | null
  similarProducts: any[] // we don't render similar here, just keep for possible future use
  announcements: any[]
}

export function SidebarPanel({ product, categories, tags, isBookmarked, isSignedIn, currentOrgId, announcements }: Props) {
  const t = useTranslations('Product')

  return (
    <div className="space-y-6">
      {/* Bookmark */}
      <Card>
        <div className="flex items-center justify-between p-5">
          <span className="text-sm font-medium text-muted-foreground">
            {t('sidebar.bookmark')}
          </span>
          <BookmarkButton
            productId={product.id}
            initialBookmarked={isBookmarked}
            size="md"
          />
        </div>
      </Card>

      {/* Confidence gauge */}
      <Card>
        <h2 className="mb-3 p-5 text-sm font-medium text-muted-foreground">
          {t('sidebar.migrationConfidence')}
        </h2>
        <div className="px-5 pb-5">
          <ConfidenceGauge score={product.confidenceScore ? parseFloat(product.confidenceScore) : null} />
        </div>
        <Link
          href="/docs/scoring-methodology"
          className="mt-3 block px-5 pb-5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {t('sidebar.howCalculated')}
        </Link>
      </Card>

      {/* Deployment methods */}
      <Card>
        <h2 className="mb-3 p-5 text-sm font-medium text-muted-foreground">
          {t('sidebar.deploymentMethods')}
        </h2>
        <div className="px-5 pb-5">
          <DeploymentMethods methods={product.deploymentMethods} />
        </div>
      </Card>

      {/* Repository stats */}
      <RepositoryStats product={product} />

      {/* Additional details */}
      <AdditionalDetails product={product} />

      {/* Categories */}
      {categories.length > 0 && (
        <Card>
          <h2 className="mb-3 p-5 text-sm font-medium text-muted-foreground">
            {t('sidebar.categories')}
          </h2>
          <div className="flex flex-wrap gap-1.5 p-5">
            {categories.map((c) => (
              <span
                key={c.slug}
                className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-body-xs font-medium text-secondary-foreground"
              >
                {c.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <Card>
          <h2 className="mb-3 p-5 text-sm font-medium text-muted-foreground">
            {t('sidebar.tags')}
          </h2>
          <div className="flex flex-wrap gap-1.5 p-5">
            {tags.map((tag) => (
              <span
                key={tag.slug}
                className="inline-block rounded-full border bg-background px-2.5 py-0.5 text-body-xs font-medium text-muted-foreground"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Links */}
      <Card className="space-y-2 p-5">
        {product.homepageUrl && (
          <a
            href={product.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {t('sidebar.visitHomepage')}
          </a>
        )}
        {product.docsUrl && (
          <a
            href={product.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {t('sidebar.docs')}
          </a>
        )}
        {product.changelogUrl && (
          <a
            href={product.changelogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {t('sidebar.changelog')}
          </a>
        )}
        {product.communityUrl && (
          <a
            href={product.communityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            {t('sidebar.community')}
          </a>
        )}
      </Card>

      {/* Suggest an edit */}
      <Card>
        <SuggestEditForm product={product} />
      </Card>

      {/* Report an issue */}
      <Card>
        <ReportForm product={product} />
      </Card>

      {/* Claim product */}
      <Card>
        <ClaimForm
          productId={product.id}
          productSlug={product.slug}
          homepageUrl={product.homepageUrl}
          githubUrl={product.githubUrl}
          claimedByOrgId={product.claimedByOrgId}
          currentOrgId={currentOrgId}
        />
      </Card>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card>
          <h2 className="mb-3 p-5 text-sm font-medium text-muted-foreground">
            {t('sidebar.announcements')}
          </h2>
          <div className="space-y-3 p-5">
            {announcements.map((a) => (
              <div key={a.id}>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{a.title}</h3>
                  {a.publishedAt && (
                    <time className="text-xs text-muted-foreground">
                      {new Date(a.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{a.body}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
