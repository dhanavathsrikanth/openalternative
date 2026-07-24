'use client'

import type { Product } from '@/app/db/schema'
import type { DetectedTech } from '@/lib/content-gen/tech-detect'
import { LicenseBadge } from './LicenseBadge'
import { GithubStats } from './GithubStats'
import { DeploymentMethods } from './DeploymentMethods'
import { ConfidenceGauge } from './ConfidenceGauge'
import { SuggestEditForm } from './SuggestEditForm'
import { ProductQA } from './ProductQA'
import { ReviewForm } from './ReviewForm'
import { ProductJsonLd } from './ProductJsonLd'
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
  reviews?: Review[]
  announcements?: Announcement[]
  approvedContent: Record<string, unknown>
  similarProducts: SimilarProduct[]
  currentOrgId: string | null
  logoUrl: string | null
  screenshotUrls: string[]
  /** Server-rendered content blocks from contentBlocks JSON — rendered on the server for SEO */
  contentBlocksHtml?: React.ReactNode
  /** Raw content blocks for structured data extraction */
  contentBlocks?: unknown[] | null
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
  reviews = [],
  announcements = [],
  approvedContent,
  similarProducts,
  currentOrgId,
  logoUrl,
  screenshotUrls,
  contentBlocksHtml,
  contentBlocks,
}: Props) {
  const score = product.confidenceScore ? parseFloat(product.confidenceScore) : null
  useAnalyticsTracking(product.id)
  useOutboundClickTracker(product.id)

  // Extract all content
  const tldr = getTldr(approvedContent)
  const personas = getPersonas(approvedContent)
  const problem = getProblem(approvedContent)
  const solutions = getSolutions(approvedContent)
  const { strengths, tradeoffs } = getStrengthsAndTradeoffs(approvedContent)
  const comparisons = getComparisons(approvedContent)
  const installMethods = getInstallMethods(approvedContent)
  const techStack = (product.techStackDetected as DetectedTech[] | null) ?? []
  const customFaq = (product.faq as { question: string; answer: string }[] | null) ?? []

  // Build FAQ pairs for structured data (auto QA + custom FAQ)
  const autoFaqPairs = [
    { question: `What is ${product.name}?`, answer: product.description },
    ...(personas ? [{ question: `Who is ${product.name} for?`, answer: personas.map((p) => `${p.persona}: ${p.useCase}`).join(' ') }] : []),
    ...(strengths ? [{ question: `What are the pros of ${product.name}?`, answer: strengths.map((s) => `${s.title}: ${s.signal}`).join(' ') }] : []),
    ...(tradeoffs ? [{ question: `What are the cons of ${product.name}?`, answer: tradeoffs.map((t) => `${t.title}: ${t.detail}`).join(' ') }] : []),
  ]
  const allFaqPairs = [...autoFaqPairs, ...customFaq.filter((f) => f.question && f.answer)]

  // Build TOC entries dynamically
  const tocEntries: TocEntry[] = []
  if (tldr) tocEntries.push({ id: 'tldr', label: 'TL;DR' })
  if (personas) tocEntries.push({ id: 'who-its-for', label: "Who it's for" })
  if (problem) tocEntries.push({ id: 'problem', label: 'The problem' })
  if (solutions) tocEntries.push({ id: 'solution', label: 'How it solves it' })
  if (strengths || tradeoffs) tocEntries.push({ id: 'strengths-tradeoffs', label: 'Strengths & trade-offs' })
  if (comparisons) tocEntries.push({ id: 'versus', label: 'Versus alternatives' })
  if (installMethods) tocEntries.push({ id: 'install', label: 'Install & self-host' })
  if (techStack.length > 0) tocEntries.push({ id: 'tech-stack', label: 'Tech stack' })
  tocEntries.push({ id: 'faq', label: 'FAQ' })
  if (similarProducts.length > 0) tocEntries.push({ id: 'similar-tools', label: 'Similar tools' })

  // Hero screenshot (first screenshot or none)
  const heroScreenshot = screenshotUrls[0] ?? null

  return (
    <>
      <ProductJsonLd
        product={product}
        logoUrl={logoUrl}
        installMethods={installMethods}
        faqPairs={allFaqPairs}
        contentBlocks={contentBlocks}
      />

      <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Forklane</Link>
          <span className="mx-2">/</span>
          <Link href="/products" className="hover:text-foreground">Products</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <header className="mb-10">
          {/* Large banner screenshot */}
          {heroScreenshot && (
            <div className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
              <img
                src={heroScreenshot}
                alt={`${product.name} screenshot`}
                className="w-full object-cover"
                loading="eager"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={`${product.name} logo`}
                className="h-12 w-12 rounded-lg object-cover"
              />
            )}
            <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>
            {product.claimedByOrgId !== null && <VerifiedBadge />}
            {product.license && <LicenseBadge license={product.license} />}
          </div>

          {product.tagline && (
            <p className="mt-2 text-lg text-muted-foreground italic">
              {product.tagline}
            </p>
          )}

          {product.primaryLanguage && (
            <p className="mt-2 text-muted-foreground">
              {product.primaryLanguage}
            </p>
          )}

          {/* Categories & Tags */}
          {(categories.length > 0 || tags.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span
                  key={c.slug}
                  className="inline-block rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground"
                >
                  {c.name}
                </span>
              ))}
              {tags.map((t) => (
                <span
                  key={t.slug}
                  className="inline-block rounded-full border bg-background px-3 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  #{t.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* ── Description ──────────────────────────────────────────────── */}
        <section className="mb-10">
          <p className="text-lg leading-relaxed text-foreground/90">
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
              /* Server-rendered content blocks from the admin editor */
              <>{contentBlocksHtml}</>
            ) : (
              <>
                {/* 01: TL;DR */}
                {tldr && <TldrSection tldr={tldr} />}

                {/* 02: Who it's for */}
                {personas && <WhoItsForSection personas={personas} />}

                {/* 03: The problem */}
                {problem && <ProblemSection problem={problem} />}

                {/* 04: How it solves it */}
                {solutions && <SolutionSection solutions={solutions} />}

                {/* 05: Strengths & Trade-offs */}
                {strengths && tradeoffs && (
                  <StrengthsTradeoffsSection strengths={strengths} tradeoffs={tradeoffs} />
                )}

                {/* 06: Versus alternatives */}
                {comparisons && (
                  <VersusAlternativesSection
                    comparisons={comparisons}
                    targets={similarProducts}
                  />
                )}

                {/* 07: Install & self-host */}
                {installMethods && <InstallMethodsSection methods={installMethods} />}

                {/* 08: Tech stack */}
                {techStack.length > 0 && <TechStackSection techStack={techStack} />}
              </>
            )}

            {/* 09: FAQ — always shown regardless of content blocks source */}
            <section id="faq" className="mb-10 scroll-mt-24">
              <ProductQA product={product} />
            </section>

            {/* 10: Similar tools */}
            <SimilarToolsSection products={similarProducts} />

            {/* ── Reviews ────────────────────────────────────────────────── */}
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
          </div>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <aside className="w-full shrink-0 space-y-6 lg:w-72">
            {/* Confidence gauge */}
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

            {/* GitHub stats */}
            <GithubStats product={product} />

            {/* Links */}
            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
              {product.githubUrl && (
                <a
                  href={product.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
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
                  className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Visit Homepage →
                </a>
              )}
              {product.docsUrl && (
                <a
                  href={product.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Docs →
                </a>
              )}
              {product.changelogUrl && (
                <a
                  href={product.changelogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Changelog →
                </a>
              )}
              {product.communityUrl && (
                <a
                  href={product.communityUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Community →
                </a>
              )}
            </div>

            {/* Suggest an edit */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <SuggestEditForm product={product} />
            </div>

            {/* Report an issue */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <ReportForm product={product} />
            </div>

            {/* Claim product */}
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <ClaimForm
                productId={product.id}
                productSlug={product.slug}
                homepageUrl={product.homepageUrl}
                githubUrl={product.githubUrl}
                claimedByOrgId={product.claimedByOrgId}
                currentOrgId={currentOrgId}
              />
            </div>

            {/* Announcements */}
            {announcements.length > 0 && (
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <h2 className="mb-3 text-sm font-medium text-muted-foreground">Announcements</h2>
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id}>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold">{a.title}</h3>
                        {a.publishedAt && (
                          <time
                            dateTime={new Date(a.publishedAt).toISOString()}
                            className="text-xs text-muted-foreground"
                          >
                            {new Date(a.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </time>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                        {a.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="mt-12 border-t pt-6 text-sm text-muted-foreground">
          {product.lastVerifiedAt && (
            <p>
              Last verified:{' '}
              <time dateTime={product.lastVerifiedAt.toISOString()}>
                {product.lastVerifiedAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </p>
          )}
        </footer>
      </main>
    </>
  )
}
