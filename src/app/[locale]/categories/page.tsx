import { db } from '@/app/db'
import { Categories, ProductCategories, Products } from '@/app/db/schema'
import { eq, sql, and, inArray } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export const revalidate = 86400 // 24h ISR

export default async function CategoriesPage() {
  const tCommon = await getTranslations('Common')
  const tCategories = await getTranslations('Categories')

  const categories = await db
    .select({
      id: Categories.id,
      name: Categories.name,
      slug: Categories.slug,
      description: Categories.description,
      productCount: sql<number>`count(${ProductCategories.productId})::int`,
    })
    .from(Categories)
    .innerJoin(ProductCategories, eq(Categories.id, ProductCategories.categoryId))
    .innerJoin(Products, and(eq(ProductCategories.productId, Products.id), inArray(Products.status, ['published'])))
    .groupBy(Categories.id)
    .orderBy(sql`count(${ProductCategories.productId}) DESC`)

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{tCommon('brand')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{tCategories('breadcrumb')}</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">{tCategories('heading')}</h1>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">{tCategories('index.empty')}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/categories/${c.slug}`}
                className="block rounded-xl border bg-card p-6 shadow-sm transition-colors duration-fast ease-out hover:bg-accent card-lift"
              >
                <h2 className="text-lg font-semibold">{c.name}</h2>
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {tCategories('index.count', { count: c.productCount })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
