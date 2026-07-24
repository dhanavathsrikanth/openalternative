import { db } from '@/app/db'
import { Products, ProductCategories, Categories } from '@/app/db/schema'
import { like, sql, and, desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PublishToggle } from './PublishToggle'

const PAGE_SIZE = 20

type PageProps = {
  searchParams: Promise<{ page?: string; search?: string; status?: string; category?: string }>
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { page: pageStr, search, status, category } = await searchParams
  const page = Math.max(1, Number(pageStr) || 1)
  const offset = (page - 1) * PAGE_SIZE

  const conditions = []

  if (search) {
    const pattern = `%${search}%`
    conditions.push(
      sql`(${Products.name} ILIKE ${pattern} OR ${Products.slug} ILIKE ${pattern})`,
    )
  }

  if (status === 'draft' || status === 'published') {
    conditions.push(sql`${Products.status} = ${status}`)
  }

  const categoryId = category ? Number(category) : null
  if (categoryId && !Number.isNaN(categoryId)) {
    conditions.push(
      sql`${Products.id} IN (SELECT ${ProductCategories.productId} FROM ${ProductCategories} WHERE ${ProductCategories.categoryId} = ${categoryId})`,
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [products, countResult, allCategories] = await Promise.all([
    db
      .select({
        id: Products.id,
        name: Products.name,
        slug: Products.slug,
        status: Products.status,
        confidenceScore: Products.confidenceScore,
        lastVerifiedAt: Products.lastVerifiedAt,
        createdAt: Products.createdAt,
      })
      .from(Products)
      .where(where)
      .orderBy(desc(Products.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(Products)
      .where(where),
    db.select({ id: Categories.id, name: Categories.name }).from(Categories).orderBy(Categories.name),
  ])

  // Fetch category names for each product
  const productIds = products.map((p) => p.id)
  const productCategoryRows = productIds.length > 0
    ? await db
        .select({ productId: ProductCategories.categoryId, categoryName: Categories.name })
        .from(ProductCategories)
        .innerJoin(Categories, eq(ProductCategories.categoryId, Categories.id))
        .where(sql`${ProductCategories.productId} IN ${productIds}`)
    : []

  const productCategoryMap = new Map<number, string[]>()
  for (const row of productCategoryRows) {
    const existing = productCategoryMap.get(row.productId) ?? []
    existing.push(row.categoryName)
    productCategoryMap.set(row.productId, existing)
  }

  const totalCount = Number(countResult[0]?.count ?? 0)
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  function buildUrl(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    if (overrides.page) params.set('page', overrides.page)
    if (overrides.search !== undefined) {
      if (overrides.search) params.set('search', overrides.search)
    } else if (search) {
      params.set('search', search)
    }
    if (overrides.status !== undefined) {
      if (overrides.status) params.set('status', overrides.status)
    } else if (status) {
      params.set('status', status)
    }
    if (overrides.category !== undefined) {
      if (overrides.category) params.set('category', overrides.category)
    } else if (category) {
      params.set('category', category)
    }
    const qs = params.toString()
    return `/admin/products${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <div className="flex items-center gap-5">
          <span className="text-sm text-muted-foreground">
            {totalCount} total
          </span>
          <Button variant="default" size="default" nativeButton={false} render={<Link href="/admin/products/new" />}>
            + New
          </Button>
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-2" action={buildUrl({ page: '1' })} method="get">
        <Input
          name="search"
          defaultValue={search}
          placeholder="Search by name or slug…"
          className="max-w-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <select
          name="category"
          defaultValue={category ?? ''}
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="">All categories</option>
          {allCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
      </form>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">Confidence</th>
              <th className="p-3">Last Verified</th>
              <th className="p-3">Created</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b last:border-b-0 hover:bg-muted/30"
              >
                <td className="p-3">
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {product.name}
                  </Link>
                  <span className="ml-2 text-xs text-muted-foreground">/{product.slug}</span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(productCategoryMap.get(product.id) ?? []).map((catName) => (
                      <span key={catName} className="inline-flex items-center rounded-full border border-card-border bg-secondary/30 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {catName}
                      </span>
                    ))}
                    {!(productCategoryMap.get(product.id)?.length) && (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant={product.status === 'published' ? 'success' : 'warning'}>
                    {product.status}
                  </Badge>
                </td>
                <td className="p-3 text-muted-foreground">
                  {product.confidenceScore ?? '—'}
                </td>
                <td className="p-3 text-muted-foreground">
                  {product.lastVerifiedAt
                    ? product.lastVerifiedAt.toLocaleDateString()
                    : '—'}
                </td>
                <td className="p-3 text-muted-foreground">
                  {product.createdAt.toLocaleDateString()}
                </td>
                <td className="p-3 text-right">
                  <PublishToggle productId={product.id} currentStatus={product.status} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-muted-foreground">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          {page <= 1 ? (
            <span className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs font-medium opacity-50">
              Previous
            </span>
          ) : (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={buildUrl({ page: String(page - 1) })} />}>
              Previous
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page >= totalPages ? (
            <span className="inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs font-medium opacity-50">
              Next
            </span>
          ) : (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={buildUrl({ page: String(page + 1) })} />}>
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
