import { db } from '@/app/db'
import { Categories, ProductCategories } from '@/app/db/schema'
import { eq, sql } from 'drizzle-orm'
import Link from 'next/link'

export const revalidate = 86400 // 24h ISR

export default async function CategoriesPage() {
  const categories = await db
    .select({
      id: Categories.id,
      name: Categories.name,
      slug: Categories.slug,
      description: Categories.description,
      productCount: sql<number>`count(${ProductCategories.productId})::int`,
    })
    .from(Categories)
    .leftJoin(ProductCategories, eq(Categories.id, ProductCategories.categoryId))
    .groupBy(Categories.id)
    .orderBy(sql`count(${ProductCategories.productId}) DESC`)

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Forklane</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Categories</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">Categories</h1>

      {categories.length === 0 ? (
        <p className="text-muted-foreground">No categories have been created yet.</p>
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
                  {c.productCount} product{c.productCount !== 1 ? 's' : ''}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
