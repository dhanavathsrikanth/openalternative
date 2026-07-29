import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/app/db'
import { Bookmarks, Products, ProductAssets, ProductTags, Tags } from '@/app/db/schema'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { ProductCard } from '@/components/ProductCard'
import Link from 'next/link'

export const metadata = {
  title: 'My Bookmarks — Forklane',
  description: 'Products you have saved for later.',
}

export default async function BookmarksPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const rows = await db
    .select({
      productId: Bookmarks.productId,
      createdAt: Bookmarks.createdAt,
      name: Products.name,
      slug: Products.slug,
      description: Products.description,
      tagline: Products.tagline,
      license: Products.license,
      primaryLanguage: Products.primaryLanguage,
      stars: Products.stars,
      forks: Products.forks,
      confidenceScore: Products.confidenceScore,
      logoUrl: ProductAssets.url,
    })
    .from(Bookmarks)
    .innerJoin(Products, eq(Bookmarks.productId, Products.id))
    .leftJoin(ProductAssets, and(eq(ProductAssets.productId, Products.id), eq(ProductAssets.type, 'logo')))
    .where(eq(Bookmarks.userId, userId))
    .orderBy(desc(Bookmarks.createdAt))

  // Fetch tags for all bookmarked products
  const productIds = rows.map((r) => r.productId)
  const tagRows = productIds.length > 0
    ? await db
        .select({ productId: ProductTags.productId, tagName: Tags.name })
        .from(ProductTags)
        .innerJoin(Tags, eq(ProductTags.tagId, Tags.id))
        .where(inArray(ProductTags.productId, productIds))
    : []

  const tagsByProduct = new Map<number, string[]>()
  for (const t of tagRows) {
    const existing = tagsByProduct.get(t.productId) ?? []
    existing.push(t.tagName)
    tagsByProduct.set(t.productId, existing)
  }

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">My Bookmarks</h1>
      <p className="mb-8 text-muted-foreground">
        Products you have saved for later.{' '}
        <Link href="/products" className="underline underline-offset-2 hover:text-foreground">
          Browse more products →
        </Link>
      </p>

      {rows.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <svg
            className="mx-auto mb-4 size-10 text-muted-foreground/50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <p className="text-muted-foreground">No bookmarks yet.</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Click the heart icon on any product to save it here.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <li key={r.productId}>
              <ProductCard
                product={{
                  id: r.productId,
                  name: r.name,
                  slug: r.slug,
                  description: r.description,
                  tagline: r.tagline,
                  license: r.license,
                  primaryLanguage: r.primaryLanguage,
                  confidenceScore: r.confidenceScore,
                }}
                logoUrl={r.logoUrl}
                stars={r.stars}
                forks={r.forks}
                tags={tagsByProduct.get(r.productId)}
                bookmarked
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
