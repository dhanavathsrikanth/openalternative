import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/app/db'
import { Organizations, Products, ProductEdits } from '@/app/db/schema'
import { eq, desc } from 'drizzle-orm'

type PageProps = { params: Promise<{ orgSlug: string }> }

export default async function DashboardOverviewPage({ params }: PageProps) {
  const session = await auth()
  if (!session.userId || !session.orgId) redirect('/sign-in')

  const { orgSlug } = await params

  const orgRows = await db
    .select()
    .from(Organizations)
    .where(eq(Organizations.slug, orgSlug))
    .limit(1)

  if (orgRows.length === 0) notFound()
  const org = orgRows[0]
  if (org.clerkOrgId !== session.orgId) redirect('/')

  const claimedProducts = await db
    .select()
    .from(Products)
    .where(eq(Products.claimedByOrgId, org.id))

  const recentEdits = await db
    .select({
      id: ProductEdits.id,
      field: ProductEdits.field,
      oldValue: ProductEdits.oldValue,
      newValue: ProductEdits.newValue,
      editorId: ProductEdits.editorId,
      createdAt: ProductEdits.createdAt,
      productName: Products.name,
      productSlug: Products.slug,
    })
    .from(ProductEdits)
    .innerJoin(Products, eq(ProductEdits.productId, Products.id))
    .where(eq(ProductEdits.organizationId, org.id))
    .orderBy(desc(ProductEdits.createdAt))
    .limit(20)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your claimed products and team settings.
        </p>
      </div>

      {/* Claimed products */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Claimed Products</h2>
        {claimedProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No products claimed yet. Visit a product page to start a claim.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {claimedProducts.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/${orgSlug}/profile/${p.id}`}
                className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
              >
                <h3 className="font-medium">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {p.tagline || p.description}
                </p>
                <span className="mt-2 inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                  {p.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Activity strip */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent Activity</h2>
        {recentEdits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No edits yet.</p>
        ) : (
          <div className="space-y-2">
            {recentEdits.map((edit) => (
              <div
                key={edit.id}
                className="flex items-start gap-3 rounded-lg border bg-card px-4 py-2.5 text-sm"
              >
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-green-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    <span className="font-medium">{edit.field}</span>
                    {' '}changed on{' '}
                    <Link
                      href={`/dashboard/${orgSlug}/profile/${edit.productSlug}`}
                      className="font-medium underline underline-offset-2"
                    >
                      {edit.productName}
                    </Link>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {edit.oldValue && (
                      <span className="line-through text-red-500/70">{edit.oldValue.length > 40 ? edit.oldValue.slice(0, 40) + '…' : edit.oldValue}</span>
                    )}
                    {edit.oldValue && ' → '}
                    <span className="text-green-600">{edit.newValue && edit.newValue.length > 40 ? edit.newValue.slice(0, 40) + '…' : edit.newValue}</span>
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {edit.createdAt ? new Date(edit.createdAt).toLocaleDateString() : ''}
                </time>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
