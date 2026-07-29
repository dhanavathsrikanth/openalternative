'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { Product } from '@/app/db/schema'
import type { DetectedTech } from '@/lib/content-gen/tech-detect'
import { HeroCard } from './components/HeroCard'
import { DetailAccordion, type AccordionSection } from './components/DetailAccordion'
import { SimilarToolsGrid } from './components/SimilarToolsGrid'
import { ReviewsSection } from './components/ReviewsSection'
import { SidebarPanel } from './components/SidebarPanel'
import { ScreenshotBanner } from './ScreenshotBanner'
import { SectionHeading } from '@/components/product/SectionHeading'
import { TldrSection } from './TldrSection'
import { WhoItsForSection } from './WhoItsForSection'
import { ProblemSection } from './ProblemSection'
import { SolutionSection } from './SolutionSection'
import { StrengthsTradeoffsSection } from './StrengthsTradeoffsSection'
import { VersusAlternativesSection } from './VersusAlternativesSection'
import { InstallMethodsSection } from './InstallMethodsSection'
import { TechStackSection } from './TechStackSection'
import { ProductQA } from './ProductQA'
import { ProductHeaderActions } from './ProductHeaderActions'
import { ProductJsonLd } from './ProductJsonLd'
import { ContentBlocksRenderer } from '@/lib/blocks/renderer'

interface Props {
  product: Product
  categories: { name: string; slug: string }[]
  tags: { name: string; slug: string }[]
  proprietaryTools: { id: number; name: string; url: string | null }[]
  reviews: any[]
  announcements: any[]
  approvedContent: Record<string, unknown>
  similarProducts: any[]
  currentOrgId: string | null
  logoUrl: string | null
  screenshotUrls: string[]
  contentBlocksHtml?: React.ReactNode
  contentBlocks?: unknown[] | null
  isDelisted?: boolean
  delistReason?: string | null
  delistedAt?: Date | null
  isBookmarked?: boolean
  isSignedIn?: boolean
}

export function NewProductPage({
  product,
  categories,
  tags,
  proprietaryTools,
  reviews,
  announcements,
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
  const [pageUrl, setPageUrl] = useState(`/products/${product.slug}`)

  useEffect(() => {
    setPageUrl(window.location.href)
  }, [])

  const heroScreenshot = screenshotUrls[0] ?? null

  // Build accordion sections – order similar to original page
  const sections: AccordionSection[] = []
  const tldr = (approvedContent as any).tldr?.tldr
  if (tldr) {
    sections.push({ id: 'tldr', label: t('toc.tldr'), content: <TldrSection tldr={tldr} /> })
  }
  const personas = (approvedContent as any).whoItsFor?.personas
  if (personas) {
    sections.push({ id: 'who', label: t('toc.whoItsFor'), content: <WhoItsForSection personas={personas} /> })
  }
  const problem = (approvedContent as any).problem?.problem
  if (problem) {
    sections.push({ id: 'problem', label: t('toc.theProblem'), content: <ProblemSection problem={problem} /> })
  }
  const solutions = (approvedContent as any).solution?.solutions
  if (solutions) {
    sections.push({ id: 'solution', label: t('toc.howItSolvesIt'), content: <SolutionSection solutions={solutions} /> })
  }
  const strengths = (approvedContent as any).strengths?.strengths
  const tradeoffs = (approvedContent as any).tradeoffs?.tradeoffs
  if (strengths || tradeoffs) {
    sections.push({
      id: 'strengths',
      label: t('toc.strengthsTradeoffs'),
      content: <StrengthsTradeoffsSection strengths={strengths} tradeoffs={tradeoffs} />, })
  }
  const comparisons = (approvedContent as any).versusAlternatives?.comparisons
  if (comparisons) {
    sections.push({
      id: 'versus',
      label: t('toc.versusAlternatives'),
      content: (
        <VersusAlternativesSection
          comparisons={comparisons}
          targets={similarProducts}
        />
      ),
    })
  }
  const installMethods = (approvedContent as any).installMethods?.methods
  if (installMethods) {
    sections.push({
      id: 'install',
      label: t('toc.installSelfHost'),
      content: <InstallMethodsSection methods={installMethods} />,
    })
  }
  const techStack = (product as any).techStackDetected as DetectedTech[] | null
  if (techStack && techStack.length > 0) {
    sections.push({
      id: 'tech',
      label: t('toc.techStack'),
      content: <TechStackSection techStack={techStack} />,
    })
  }
  // FAQ – always include
  sections.push({
    id: 'faq',
    label: t('toc.faq'),
    content: (
      <section id="faq" className="mb-section scroll-mt-24">
        <ProductQA product={product} />
      </section>
    ),
  })

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8 lg:grid lg:grid-cols-4 gap-8">
        {/* Left/main column */}
        <section className="lg:col-span-3 space-y-8">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">{tCommon('brand')}</Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-foreground">{tCommon('nav.products')}</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          {/* Delisted notice */}
          {isDelisted && (
            <div className="rounded border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
              <p className="font-semibold">{t('delisted.title')}</p>
              <p>{t('delisted.body')}</p>
              {delistReason && <p className="mt-2">Reason: {delistReason}</p>}
              {delistedAt && (
                <p className="mt-1 text-xs opacity-80">
                  {t('delisted.date', { date: new Date(delistedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) })}
                </p>
              )}
            </div>
          )}

          {/* Hero */}
          <div>
            {heroScreenshot && (
              <ScreenshotBanner src={heroScreenshot} alt={`${product.name} screenshot`} pageUrl={pageUrl} />
            )}
            <HeroCard
            product={product}
            logoUrl={logoUrl}
            proprietaryTools={proprietaryTools}
            isBookmarked={isBookmarked}
            isSignedIn={isSignedIn}
          />
          </div>

          {/* Accordion content */}
          <DetailAccordion sections={sections} />

          {/* Similar tools */}
          <SimilarToolsGrid products={similarProducts} />

          {/* Reviews */}
          <ReviewsSection productId={product.id} reviews={reviews} />
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-1 hidden lg:block">
          <SidebarPanel
            product={product}
            categories={categories}
            tags={tags}
            isBookmarked={isBookmarked}
            isSignedIn={isSignedIn}
            currentOrgId={currentOrgId}
            announcements={announcements}
            similarProducts={similarProducts}
          />
        </aside>
      </main>
      <footer className="mt-12 border-t border-border-subtle py-6 text-sm text-muted-foreground">
        {product.lastVerifiedAt && (
          <p>{t('lastVerified', { date: product.lastVerifiedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) })}</p>
        )}
      </footer>
      {/* JSON‑LD – same as old page */}
      <ProductJsonLd
        product={product}
        logoUrl={logoUrl ?? undefined}
        installMethods={(approvedContent as any).installMethods?.methods ?? null}
        faqPairs={(() => {
          const faq: { question: string; answer: string }[] = []
          const auto = [
            { q: t('faq.whatIs', { name: product.name }), a: product.description },
            ...((approvedContent as any).whoItsFor?.personas?.map((p: any) => ({ q: t('faq.whoIsFor', { name: product.name }), a: `${p.persona}: ${p.useCase}` })) ?? []),
            ...((approvedContent as any).strengths?.strengths?.map((s: any) => ({ q: t('faq.prosOf', { name: product.name }), a: `${s.title}: ${s.signal}` })) ?? []),
            ...((approvedContent as any).tradeoffs?.tradeoffs?.map((t: any) => ({ q: t('faq.consOf', { name: product.name }), a: `${t.title}: ${t.detail}` })) ?? []),
          ]
          return [...auto, ...(approvedContent as any).faq?.filter((f: any) => f.question && f.answer) ?? []]
        })()}
        contentBlocks={contentBlocks}
      />
    </>
  )
}
