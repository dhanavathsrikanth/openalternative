import { db } from '@/app/db'
import { Products } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Suspense } from 'react'
import { SortControl } from '@/components/SortControl'
import { PRODUCT_SORT_OPTIONS, DEFAULT_SORT, orderBySort } from '@/lib/sort'

export const revalidate = 86400 // 24h ISR

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

function isSortValue(v: string | undefined): v is string {
  return PRODUCT_SORT_OPTIONS.some((o) => o.value === v)
}

type PageProps = {
  searchParams: Promise<{ sort?: string }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const t = await getTranslations('Products')
  const { sort: rawSort } = await searchParams
  const sort = isSortValue(rawSort) ? rawSort : DEFAULT_SORT

  const products = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      description: Products.description,
      license: Products.license,
      primaryLanguage: Products.primaryLanguage,
      stars: Products.stars,
      forks: Products.forks,
    })
    .from(Products)
    .where(eq(Products.status, 'published'))
    .orderBy(orderBySort(sort))

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t('heading')}</h1>
        <Suspense>
          <SortControl options={PRODUCT_SORT_OPTIONS} currentSort={sort} />
        </Suspense>
      </div>

      {products.length === 0 ? (
        <p className="text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <ul className="space-y-4">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/product/${p.slug}`}
                className="block rounded-xl border bg-card p-6 shadow-sm transition-colors duration-fast ease-out hover:bg-accent card-lift"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold">{p.name}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {p.primaryLanguage && <span>{p.primaryLanguage}</span>}
                  {p.license && <span>• {p.license}</span>}
                  {p.stars != null && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="size-3.5 shrink-0 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {formatNumber(p.stars)}
                    </span>
                  )}
                  {p.forks != null && (
                    <span className="inline-flex items-center gap-1">
                      <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /><path d="M12 12v3" />
                      </svg>
                      {formatNumber(p.forks)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
