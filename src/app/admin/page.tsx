import { db } from '@/app/db'
import {
  Products,
  Categories,
  ProductAssets,
} from '@/app/db/schema'
import { eq, count, sql, desc } from 'drizzle-orm'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function AdminOverviewPage() {
  let missingLogoProducts: { id: number; name: string; slug: string; status: string; createdAt: Date }[] = []

  const [
    [totalProducts],
    [draftProducts],
    [publishedProducts],
    [totalCategories],
  ] = await Promise.all([
    db.select({ value: count() }).from(Products),
    db.select({ value: count() }).from(Products).where(eq(Products.status, 'draft')),
    db.select({ value: count() }).from(Products).where(eq(Products.status, 'published')),
    db.select({ value: count() }).from(Categories),
  ])

  // Query product_assets separately — table may not exist yet
  try {
    missingLogoProducts = await db
      .select({
        id: Products.id,
        name: Products.name,
        slug: Products.slug,
        status: Products.status,
        createdAt: Products.createdAt,
      })
      .from(Products)
      .leftJoin(
        ProductAssets,
        sql`${ProductAssets.productId} = ${Products.id} AND ${ProductAssets.type} = 'logo'`,
      )
      .where(sql`${ProductAssets.id} IS NULL`)
      .orderBy(desc(Products.createdAt))
      .limit(20)
  } catch {
    // product_assets table not migrated yet — show all products as missing logo
    missingLogoProducts = await db
      .select({
        id: Products.id,
        name: Products.name,
        slug: Products.slug,
        status: Products.status,
        createdAt: Products.createdAt,
      })
      .from(Products)
      .orderBy(desc(Products.createdAt))
      .limit(20)
  }

  const statCards = [
    { label: 'Total Products', value: totalProducts.value, href: '/admin/products' },
    { label: 'Draft', value: draftProducts.value, href: '/admin/products?status=draft', variant: 'warning' as const },
    { label: 'Published', value: publishedProducts.value, href: '/admin/products?status=published', variant: 'success' as const },
    { label: 'Categories', value: totalCategories.value, href: '/admin/categories' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
          >
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">
            Products Missing Logo
            {missingLogoProducts.length > 0 && (
              <Badge variant="warning" className="ml-2 text-xs">
                {missingLogoProducts.length >= 20 ? '20+' : missingLogoProducts.length}
              </Badge>
            )}
          </h2>
          {missingLogoProducts.length >= 20 && (
            <Link
              href="/admin/products"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              View all products →
            </Link>
          )}
        </div>

        {missingLogoProducts.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            All products have a logo.
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">ID</th>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Slug</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {missingLogoProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{product.id}</td>
                    <td className="p-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{product.slug}</td>
                    <td className="p-3">
                      <Badge variant={product.status === 'published' ? 'success' : 'warning'}>
                        {product.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {product.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
