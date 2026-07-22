'use client'

import type { Product } from '@/app/db/schema'
import { LicenseBadge } from './LicenseBadge'
import { GithubStats } from './GithubStats'
import { DeploymentMethods } from './DeploymentMethods'
import { ConfidenceGauge } from './ConfidenceGauge'
import { SuggestEditForm } from './SuggestEditForm'
import { ProductQA } from './ProductQA'
import { ReviewForm } from './ReviewForm'
import { ProductJsonLd } from './ProductJsonLd'
import Link from 'next/link'

interface Review {
  id: number
  rating: number
  body: string
  createdAt: Date
  contributorName: string | null
}

interface Props {
  product: Product
  categories: { name: string; slug: string }[]
  reviews?: Review[]
}

export function ProductPage({ product, categories, reviews = [] }: Props) {
  const score = product.confidenceScore ? parseFloat(product.confidenceScore) : null

  return (
    <>
      <ProductJsonLd product={product} />

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Forklane</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-foreground">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-start gap-4">
            <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
            {product.license && <LicenseBadge license={product.license} />}
          </div>

          {product.primaryLanguage && (
            <p className="mt-2 text-muted-foreground">
              {product.primaryLanguage}
            </p>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c.slug}
                  className="inline-block rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Description */}
        <section className="mb-10">
          <p className="text-lg leading-relaxed text-foreground/90">
            {product.description}
          </p>
        </section>

        {/* Stats grid */}
        <section className="mb-10 grid gap-6 sm:grid-cols-2">
          {/* Confidence score */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Migration Confidence
            </h2>
            <ConfidenceGauge score={score} />
            <Link
              href="/docs/scoring-methodology"
              className="mt-3 inline-block text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              How is this calculated?
            </Link>
          </div>

          {/* Deployment methods */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Deployment Methods
            </h2>
            <DeploymentMethods methods={product.deploymentMethods} />
          </div>
        </section>

        {/* GitHub stats widget */}
        {product.githubUrl && (
          <section className="mb-10">
            <GithubStats url={product.githubUrl} />
          </section>
        )}

        {/* Links */}
        <section className="mb-10 flex flex-wrap gap-4">
          {product.githubUrl && (
            <a
              href={product.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          )}
          {product.homepageUrl && (
            <a
              href={product.homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              Visit Homepage →
            </a>
          )}
        </section>

        {/* Suggest an edit */}
        <section className="mb-10">
          <SuggestEditForm product={product} />
        </section>

        {/* Q&A Block */}
        <section className="mb-10">
          <ProductQA product={product} />
        </section>

        {/* Reviews */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-4 mb-6">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                    <span className="text-sm font-medium">{review.contributorName || 'Anonymous'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-6">No reviews yet. Be the first!</p>
          )}
          <ReviewForm productId={product.id} />
        </section>

        {/* Last verified */}
        {product.lastVerifiedAt && (
          <footer className="border-t pt-6 text-sm text-muted-foreground">
            Last verified:{' '}
            <time dateTime={product.lastVerifiedAt.toISOString()}>
              {product.lastVerifiedAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </footer>
        )}
      </main>
    </>
  )
}
