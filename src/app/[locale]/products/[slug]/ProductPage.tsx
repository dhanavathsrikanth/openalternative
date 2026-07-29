'use client'

import { useState, useEffect } from 'react'
import type { Product } from '@/app/db/schema'
import type { DetectedTech } from '@/lib/content-gen/tech-detect'
import { useTranslations } from 'next-intl'
import { LicenseBadge } from './LicenseBadge'
import { RepositoryStats } from './RepositoryStats'
import { AdditionalDetails } from './AdditionalDetails'
import { DeploymentMethods } from './DeploymentMethods'
import { ConfidenceGauge } from './ConfidenceGauge'
import { SuggestEditForm } from './SuggestEditForm'
import { ProductQA } from './ProductQA'
import { ReviewForm } from './ReviewForm'

import { VerifiedBadge } from './VerifiedBadge'
import { ClaimForm } from './ClaimForm'
import { StickyToc, type TocEntry } from './StickyToc'
import { TldrSection } from './TldrSection'
import { WhoItsForSection } from './WhoItsForSection'
import { ProblemSection } from './ProblemSection'
import { SolutionSection } from './SolutionSection'
import { StrengthsTradeoffsSection } from './StrengthsTradeoffsSection'
import { VersusAlternativesSection } from './VersusAlternativesSection'
import { InstallMethodsSection } from './InstallMethodsSection'
import { TechStackSection } from './TechStackSection'
import { SimilarToolsSection } from './SimilarToolsSection'
import { ReportForm } from './ReportForm'
import { BookmarkButton } from '@/components/BookmarkButton'
import { ProductHeaderActions } from './ProductHeaderActions'
import { ScreenshotBanner } from './ScreenshotBanner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/product/ProductCard'
import { SectionHeading } from '@/components/product/SectionHeading'
import { formatStatNumber } from '@/lib/format'
import Link from 'next/link'
import { useAnalyticsTracking, useOutboundClickTracker } from '@/lib/analytics-tracker'

interface Review {
  id: number
  rating: number
  body: string
  createdAt: Date
  contributorName: string | null
}

interface Announcement {
  id: number
  title: string
  body: string
  publishedAt: Date | null
}

interface SimilarProduct {
  id: number
  name: string
  slug: string
  description: string
  logoUrl: string | null
}

interface InstallMethod {
  method: string
  label: string
  commands: string[]
  extracted: boolean
  needsTechnicalReview: boolean
  source?: string
}

interface Props {
  product: Product
  categories: { name: string; slug: string }[]
  tags: { name: string; slug: string }[]
  proprietaryTools?: { id: number; name: string; url: string | null }[]
  reviews?: Review[]
  announcements?: Announcement[]
  approvedContent: Record<string, unknown>
  similarProducts: SimilarProduct[]
  currentOrgId: string | null
  logoUrl: string | null
  screenshotUrls: string[]
  contentBlocksHtml?: React.ReactNode
  contentBlocks?: unknown[] | null
  isDelisted?: boolean
  delistReason?: string | null
  isBookmarked?: boolean
  isSignedIn?: boolean
  delistedAt?: Date | null
}

// ── Content type extractors ────────────────────────────────────────────────

function getTldr(content: Record<string, unknown>): string | null {
  const data = content.tldr as { tldr: string } | undefined
  return data?.tldr ?? null
}

function getPersonas(content: Record<string, unknown>) {
  const data = content.whoItsFor as { personas: { persona: string; useCase: string; skipIf: string }[] } | undefined
  return data?.personas ?? null
}

function getProblem(content: Record<string, unknown>): string | null {
  const data = content.problem as { problem: string } | undefined
  return data?.problem ?? null
}

function getSolutions(content: Record<string, unknown>) {
  const data = content.solution as { solutions: { title: string; description: string }[] } | undefined
  return data?.solutions ?? null
}

function getStrengthsAndTradeoffs(content: Record<string, unknown>) {
  const strengths = (content.strengths as { strengths: { title: string; signal: string }[] } | undefined)?.strengths ?? null
  const tradeoffs = (content.tradeoffs as { tradeoffs: { title: string; detail: string }[] } | undefined)?.tradeoffs ?? null
  return { strengths, tradeoffs }
}

function getComparisons(content: Record<string, unknown>) {
  const data = content.versusAlternatives as { comparisons: { comparedProductId: number; comparedProductName: string; body: string; summary: string }[] } | undefined
  return data?.comparisons ?? null
}

function getInstallMethods(content: Record<string, unknown>): InstallMethod[] | null {
  const data = content.installMethods as { methods: InstallMethod[] } | undefined
  return data?.methods ?? null
}

// ── Component ──────────────────────────────────────────────────────────────

export function ProductPage({
  product,
  categories,
  tags,
  proprietaryTools = [],
  reviews = [],
  announcements = [],
  approvedContent,
  similarProducts,
  currentOrgId,
  logoUrl,
  screenshotUrls,
  contentBlocksHtml,
  contentBlocks,
  isDelisted = false,
  delistReason = null,
  delistedAt = null,
  isBookmarked = false,
  isSignedIn = false,
}: Props) {
  const t = useTranslations('Product')
  const tCommon = useTranslations('Common')
  const tGithub = useTranslations('Product.github')
  const score = product.confidenceScore ? parseFloat(product.confidenceScore) : null
  useAnalyticsTracking(product.id)
  useOutboundClickTracker(product.id)

  // Client-side time ago for lastPushedAt to avoid hydration mismatch
  const [lastPushedTimeAgo, setLastPushedTimeAgo] = useState<string>('')
  useEffect(() => {
    if (product.lastPushedAt) {
      const date = new Date(product.lastPushedAt)
      const diff = Date.now() - date.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      let timeAgoStr = ''
      if (days === 0) timeAgoStr = 'today'
      else if (days === 1) timeAgoStr = 'yesterday'
      else if (days < 30) timeAgoStr = `${days}d ago`
      else if (days < 365) timeAgoStr = `${Math.floor(days / 30)}mo ago`
      else timeAgoStr = `${Math.floor(days / 365)}yr ago`
      setLastPushedTimeAgo(timeAgoStr)
    }
  }, [product.lastPushedAt])

  const tldr = getTldr(approvedContent)
  const personas = getPersonas(approvedContent)
  const problem = getProblem(approvedContent)
  const solutions = getSolutions(approvedContent)
  const { strengths, tradeoffs } = getStrengthsAndTradeoffs(approvedContent)
  const comparisons = getComparisons(approvedContent)
  const installMethods = getInstallMethods(approvedContent)
  const techStack = (product.techStackDetected as DetectedTech[] | null) ?? []

  const tocEntries: TocEntry[] = []
  if (tldr) tocEntries.push({ id: 'tldr', label: t('toc.tldr') })
  if (personas) tocEntries.push({ id: 'who-its-for', label: t('toc.whoItsFor') })
  if (problem) tocEntries.push({ id: 'problem', label: t('toc.theProblem') })
  if (solutions) tocEntries.push({ id: 'solution', label: t('toc.howItSolvesIt') })
  if (strengths || tradeoffs) tocEntries.push({ id: 'strengths-tradeoffs', label: t('toc.strengthsTradeoffs') })
  if (comparisons) tocEntries.push({ id: 'versus', label: t('toc.versusAlternatives') })
  if (installMethods) tocEntries.push({ id: 'install', label: t('toc.installSelfHost') })
  if (techStack.length > 0) tocEntries.push({ id: 'tech-stack', label: t('toc.techStack') })
  tocEntries.push({ id: 'faq', label: t('toc.faq') })
  if (similarProducts.length > 0) tocEntries.push({ id: 'similar-tools', label: t('toc.similarTools') })

  const heroScreenshot = screenshotUrls[0] ?? null

  const [pageUrl, setPageUrl] = useState(`/products/${product.slug}`)

  useEffect(() => {
    setPageUrl(window.location.href)
  }, [])

  return (
    <>
      <main className="mx-auto max-w-[68rem] px-gutter lg:px-8 py-section pt-[var(--header-height)]">
        {/* Breadcrumb */}
        <nav className="mb-6 text-body-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">{tCommon('brand')}</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-foreground">{tCommon('nav.products')}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* Delisted notice */}
        {isDelisted && (
          <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 p-5 text-body-sm text-warning">
            <p className="font-semibold mb-1">
              {t('delisted.title')}
            </p>
            <p>
              {t('delisted.body')}
            </p>
            {delistReason && (
              <p className="mt-2">
                Reason: {delistReason}
              </p>
            )}
            {delistedAt && (
              <p className="mt-1 text-body-xs opacity-80">
                {t('delisted.date', { date: new Date(delistedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) })}
              </p>
            )}
          </div>
        )}

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <header className="mb-section">
          {heroScreenshot && (
            <ScreenshotBanner
              src={heroScreenshot}
              alt={`${product.name} screenshot`}
              pageUrl={pageUrl}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={`${product.name} logo`}
                  className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                />
              )}
              <h1 className="text-4xl font-display font-bold tracking-tight leading-tight overflow-wrap-anywhere break-words max-w-full">{product.name}</h1>
              {product.claimedByOrgId !== null && <VerifiedBadge />}
            </div>
            <ProductHeaderActions
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              initialBookmarked={isBookmarked}
              isSignedIn={isSignedIn}
            />
          </div>

          {product.tagline ? (
            <p className="mt-4 text-body-lg text-muted-foreground italic leading-relaxed line-clamp-2">
              {product.tagline}
            </p>
          ) : (
            <p className="mt-4 text-body-lg text-muted-foreground leading-relaxed line-clamp-2">
              {product.description}
            </p>
          )}

          {proprietaryTools.length > 0 && (
            <p className="mt-3 text-body-sm text-muted-foreground leading-relaxed line-clamp-2">
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
                    <span className="font-medium text-foreground/80">{tool.name}</span>
                  )}
                  {i < proprietaryTools.length - 1 && <span className="text-muted-foreground">, </span>}
                </span>
              ))}
            </p>
          )}

          {(product.stars != null ||
            product.license ||
            product.primaryLanguage ||
            product.lastPushedAt) && (
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
              {product.stars != null && (
                <Badge variant="secondary" title={tGithub('stars')}>
                  <svg className="size-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  {formatStatNumber(product.stars)}
                </Badge>
              )}
              {product.license && <LicenseBadge license={product.license} />}
              {product.primaryLanguage && (
                <Badge variant="secondary">{product.primaryLanguage}</Badge>
              )}
              {product.lastPushedAt && (
                <Badge variant="secondary">
                  {t('hero.updated', { time: lastPushedTimeAgo || '...' })}
                </Badge>
              )}
            </div>
          )}

          {(product.homepageUrl || product.githubUrl) && (
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
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
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  {t('hero.viewGithubRepo')}
                </Button>
              )}
            </div>
          )}

          {(categories.length > 0 || tags.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c.slug}
                  className="inline-block rounded-full bg-secondary px-3 py-0.5 text-body-xs font-medium text-secondary-foreground"
                >
                  {c.name}
                </span>
              ))}
              {tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="inline-block rounded-full border bg-background px-3 py-0.5 text-body-xs font-medium text-muted-foreground"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* ── Description ──────────────────────────────────────────────── */}
        <section className="mb-section">
          <p className="text-body-lg leading-relaxed text-foreground/90">
            {product.description}
          </p>
        </section>

        {/* ── Table of Contents ────────────────────────────────────────── */}
        <StickyToc entries={tocEntries} />

        {/* ── Two-column layout: Content + Sidebar ─────────────────────── */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* ── Main content column ─────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {contentBlocksHtml ? (
              <>{contentBlocksHtml}</>
            ) : (
              <>
                {tldr && <TldrSection tldr={tldr} />}
                {personas && <WhoItsForSection personas={personas} />}
                {problem && <ProblemSection problem={problem} />}
                {solutions && <SolutionSection solutions={solutions} />}
                {(strengths || tradeoffs) && (
                  <StrengthsTradeoffsSection strengths={strengths ?? []} tradeoffs={tradeoffs ?? []} />
                )}
                {comparisons && (
                  <VersusAlternativesSection
                    comparisons={comparisons}
                    targets={similarProducts}
                  />
                )}
                {installMethods && <InstallMethodsSection methods={installMethods} />}
                {techStack.length > 0 && <TechStackSection techStack={techStack} />}
              </>
            )}

            {/* FAQ — always shown regardless of content blocks source */}
            <section id="faq" className="mb-section scroll-mt-24">
              <ProductQA product={product} />
            </section>

            <SimilarToolsSection products={similarProducts} />

            {/* ── Reviews ────────────────────────────────────────────────── */}
            <section className="mb-section">
              <SectionHeading number="11" label={t('reviews.heading')} />
              {reviews.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {reviews.map((review) => (
                    <ProductCard key={review.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-yellow-500">
                          {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                        </span>
                        <span className="text-body-sm font-medium">{review.contributorName || t('reviews.anonymous')}</span>
                        <span className="text-body-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-body-sm text-muted-foreground">{review.body}</p>
                    </ProductCard>
                  ))}
                </div>
              ) : (
                <p className="text-body-sm text-muted-foreground mb-6">{t('reviews.empty')}</p>
              )}
              <ReviewForm productId={product.id} />
            </section>
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="w-full shrink-0 space-y-6 lg:w-72">
            {/* Bookmark */}
            <ProductCard>
              <div className="flex items-center justify-between">
                <span className="text-body-sm font-medium text-muted-foreground">
                  {t('sidebar.bookmark')}
                </span>
                <BookmarkButton
                  productId={product.id}
                  initialBookmarked={isBookmarked}
                  size="md"
                />
              </div>
            </ProductCard>

            {/* Confidence gauge */}
            <ProductCard>
              <h2 className="mb-3 text-body-sm font-medium text-muted-foreground">
                {t('sidebar.migrationConfidence')}
              </h2>
              <ConfidenceGauge score={score} />
              <Link
                href="/docs/scoring-methodology"
                className="mt-3 inline-block text-body-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {t('sidebar.howCalculated')}
              </Link>
            </ProductCard>

            {/* Deployment methods */}
            <ProductCard>
              <h2 className="mb-3 text-body-sm font-medium text-muted-foreground">
                {t('sidebar.deploymentMethods')}
              </h2>
              <DeploymentMethods methods={product.deploymentMethods} />
            </ProductCard>

            {/* GitHub stats */}
            <RepositoryStats product={product} />

            {/* Additional details */}
            <AdditionalDetails product={product} />

            {/* Categories */}
            {categories.length > 0 && (
              <ProductCard>
                <h2 className="mb-3 text-body-sm font-medium text-muted-foreground">
                  {t('sidebar.categories')}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <span
                      key={c.slug}
                      className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-body-xs font-medium text-secondary-foreground"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </ProductCard>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <ProductCard>
                <h2 className="mb-3 text-body-sm font-medium text-muted-foreground">
                  {t('sidebar.tags')}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag.slug}
                      className="inline-block rounded-full border bg-background px-2.5 py-0.5 text-body-xs font-medium text-muted-foreground"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </ProductCard>
            )}

            {/* Links */}
            <ProductCard className="space-y-2">
              {product.homepageUrl && (
                <a
                  href={product.homepageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-body-sm font-medium transition-colors hover:bg-accent"
                >
                  {t('sidebar.visitHomepage')}
                </a>
              )}
              {product.docsUrl && (
                <a
                  href={product.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-body-sm font-medium transition-colors hover:bg-accent"
                >
                  {t('sidebar.docs')}
                </a>
              )}
              {product.changelogUrl && (
                <a
                  href={product.changelogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-body-sm font-medium transition-colors hover:bg-accent"
                >
                  {t('sidebar.changelog')}
                </a>
              )}
              {product.communityUrl && (
                <a
                  href={product.communityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-body-sm font-medium transition-colors hover:bg-accent"
                >
                  {t('sidebar.community')}
                </a>
              )}
            </ProductCard>

            {/* Suggest an edit */}
            <ProductCard>
              <SuggestEditForm product={product} />
            </ProductCard>

            {/* Report an issue */}
            <ProductCard>
              <ReportForm product={product} />
            </ProductCard>

            {/* Claim product */}
            <ProductCard>
              <ClaimForm
                productId={product.id}
                productSlug={product.slug}
                homepageUrl={product.homepageUrl}
                githubUrl={product.githubUrl}
                claimedByOrgId={product.claimedByOrgId}
                currentOrgId={currentOrgId}
              />
            </ProductCard>

            {/* Announcements */}
            {announcements.length > 0 && (
              <ProductCard>
                <h2 className="mb-3 text-body-sm font-medium text-muted-foreground">{t('sidebar.announcements')}</h2>
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-body-sm font-display font-semibold">{a.title}</h3>
                        {a.publishedAt && (
                          <time
                            dateTime={new Date(a.publishedAt).toISOString()}
                            className="text-body-xs text-muted-foreground"
                          >
                            {new Date(a.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </time>
                        )}
                      </div>
                      <p className="text-body-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {a.body}
                      </p>
                    </div>
                  ))}
                </div>
              </ProductCard>
            )}
          </aside>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="mt-12 border-t border-border-subtle pt-6 text-body-sm text-muted-foreground">
          {product.lastVerifiedAt && (
            <p>
              {t('lastVerified', { date: product.lastVerifiedAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) })}
            </p>
          )}
        </footer>
      </main>
    </>
  )
}
