import Link from 'next/link'
import { GitForkIcon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { FooterNewsletter } from '@/components/FooterNewsletter'
import { db } from '@/app/db'
import { Categories, Products, ProductCategories, ProprietaryTools, ProductAlternatives } from '@/app/db/schema'
import { eq, sql, and, inArray, desc } from 'drizzle-orm'

function FooterLinkColumn({
  title,
  links,
}: {
  title: string
  links: readonly { href: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-sm text-text-tertiary transition-colors duration-fast ease-out hover:text-text-primary"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterPopularList({
  title,
  items,
}: {
  title: string
  items: readonly { href: string; label: string; count: number }[]
}) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      <ul className="flex flex-col gap-2">
        {items.map(({ href, label, count }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-sm text-text-tertiary transition-colors duration-fast ease-out hover:text-text-primary"
            >
              {label}{' '}
              <span className="text-text-tertiary/60">({count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export async function SiteFooter() {
  const t = await getTranslations('Footer')
  const tc = await getTranslations('Common')

  const BROWSE_LINKS = [
    { href: '/products', label: tc('nav.products') },
    { href: '/categories', label: tc('nav.categories') },
    { href: '/compare', label: tc('nav.compare') },
    { href: '/search', label: tc('search') },
  ] as const

  const COLLECTIONS_LINKS = [
    { href: '/collections', label: tc('nav.collections') },
    { href: '/guides', label: tc('nav.guides') },
    { href: '/methodology', label: t('methodology') },
  ] as const

  const QUICK_LINKS = [
    { href: '/submit', label: t('submitTool') },
    { href: '/privacy', label: t('privacyPolicy') },
    { href: '/terms', label: t('termsOfService') },
    { href: '/sitemap.xml', label: t('sitemap') },
  ] as const

  const COMMUNITY_LINKS = [
    { href: '/contributors', label: t('contributors') },
    { href: '/graveyard', label: t('graveyard') },
  ] as const

  // Popular categories: top 12 by product count (only published products)
  const popularCategories = await db
    .select({
      name: Categories.name,
      slug: Categories.slug,
      productCount: sql<number>`count(${ProductCategories.productId})::int`,
    })
    .from(Categories)
    .innerJoin(ProductCategories, eq(Categories.id, ProductCategories.categoryId))
    .innerJoin(Products, and(eq(ProductCategories.productId, Products.id), inArray(Products.status, ['published'])))
    .groupBy(Categories.id)
    .orderBy(desc(sql`count(${ProductCategories.productId})`))
    .limit(12)

  const categoryItems = popularCategories.map((c) => ({
    href: `/categories/${c.slug}`,
    label: c.name,
    count: c.productCount,
  }))

  // Popular proprietary tools: top 12 by number of linked open-source alternatives.
  // Wrapped in try/catch so the footer still renders if the tables haven't been
  // created yet (migrations 0030/0032).
  let proprietaryToolItems: { href: string; label: string; count: number }[] = []
  try {
    const popularProprietaryTools = await db
      .select({
        name: ProprietaryTools.name,
        slug: ProprietaryTools.slug,
        alternativeCount: sql<number>`count(${ProductAlternatives.productId})::int`,
      })
      .from(ProprietaryTools)
      .innerJoin(ProductAlternatives, eq(ProprietaryTools.id, ProductAlternatives.proprietaryToolId))
      .innerJoin(Products, and(eq(ProductAlternatives.productId, Products.id), eq(Products.status, 'published')))
      .groupBy(ProprietaryTools.id)
      .orderBy(desc(sql`count(${ProductAlternatives.productId})`))
      .limit(12)

    proprietaryToolItems = popularProprietaryTools.map((tool) => ({
      href: `/alternatives-to/${tool.slug}`,
      label: tool.name,
      count: tool.alternativeCount,
    }))
  } catch {
    // Table may not exist yet — render footer without popular alternatives
  }

  return (
    <footer className="mt-auto flex flex-col gap-8 border-t border-foreground/10 pt-fluid-md">
      <div className="mx-auto w-full max-w-[68rem] px-6 lg:px-8 flex flex-col gap-8">
        {/* Main content — 5-column layout matching competitor */}
        <div className="flex flex-col gap-10 md:grid md:grid-cols-2 md:gap-8 lg:grid-cols-5 lg:gap-12">
          {/* Column 1: Brand + tagline + newsletter */}
          <div className="flex flex-col items-start gap-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <GitForkIcon className="size-5 text-text-primary" />
              <span className="text-sm font-medium text-text-primary">
                {tc('brand')}
              </span>
            </Link>
            <p className="text-sm text-text-tertiary">
              {tc('description')}
            </p>
            <FooterNewsletter />
          </div>

          {/* Column 2: Browse */}
          <FooterLinkColumn title={t('column.browse')} links={BROWSE_LINKS} />

          {/* Column 3: Collections */}
          <FooterLinkColumn title={t('column.collections')} links={COLLECTIONS_LINKS} />

          {/* Column 4: Quick Links */}
          <FooterLinkColumn title={t('column.quickLinks')} links={QUICK_LINKS} />

          {/* Column 5: Community */}
          <FooterLinkColumn title={t('column.community')} links={COMMUNITY_LINKS} />
        </div>

        {/* Popular sections — 3-column layout (two lists + empty space for 3-col balance) */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-12">
          <FooterPopularList title={t('popularCategories')} items={categoryItems} />
          <FooterPopularList title={t('popularAlternatives')} items={proprietaryToolItems} />
          <div className="hidden md:block" />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-end md:justify-between gap-x-4 gap-y-2 text-sm text-text-tertiary">
          <p>
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
          <p>
            {t('builtWith', { builder: 'Neon + Next.js' })}
          </p>
          <p>
            {t('madeBy', { name: 'Forklane Team' })}
          </p>
        </div>
      </div>
    </footer>
  )
}