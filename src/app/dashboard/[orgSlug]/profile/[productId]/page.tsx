import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/app/db'
import {
  Organizations,
  Products,
  ProductCategories,
  Categories,
  ProductTags,
  Tags,
  ProductAssets,
} from '@/app/db/schema'
import { eq, and } from 'drizzle-orm'
import { ProductProfileEditor } from './ProductProfileEditor'

type PageProps = {
  params: Promise<{ orgSlug: string; productId: string }>
}

export default async function ProductProfilePage({ params }: PageProps) {
  const session = await auth()
  if (!session.userId || !session.orgId) redirect('/sign-in')

  const { orgSlug, productId: productIdParam } = await params
  const productId = parseInt(productIdParam)

  const orgRows = await db
    .select()
    .from(Organizations)
    .where(eq(Organizations.slug, orgSlug))
    .limit(1)

  if (orgRows.length === 0) notFound()
  const org = orgRows[0]
  if (org.clerkOrgId !== session.orgId) redirect('/')

  const role = (session.orgRole ?? 'org:viewer') as string
  const hierarchy: Record<string, number> = {
    'org:owner': 50, 'org:admin': 40, 'org:editor': 30, 'org:marketing': 20, 'org:viewer': 10,
  }
  if ((hierarchy[role] ?? 0) < (hierarchy['org:editor'] ?? 30)) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        You need the Editor role or higher to edit product profiles.
      </div>
    )
  }

  const productRows = await db
    .select()
    .from(Products)
    .where(
      and(eq(Products.id, productId), eq(Products.claimedByOrgId, org.id))
    )
    .limit(1)

  if (productRows.length === 0) notFound()
  const product = productRows[0]

  const assignedCats = await db
    .select({ categoryId: ProductCategories.categoryId })
    .from(ProductCategories)
    .where(eq(ProductCategories.productId, productId))
  const assignedCatIds = assignedCats.map((r) => r.categoryId)

  const allCategories = await db.select().from(Categories)

  const assignedTags = await db
    .select({ tagId: ProductTags.tagId })
    .from(ProductTags)
    .where(eq(ProductTags.productId, productId))
  const assignedTagIds = assignedTags.map((r) => r.tagId)

  const allTags = await db.select().from(Tags)

  const assets = await db
    .select({
      id: ProductAssets.id,
      type: ProductAssets.type,
      url: ProductAssets.url,
      assetId: ProductAssets.assetId,
      createdAt: ProductAssets.createdAt,
    })
    .from(ProductAssets)
    .where(eq(ProductAssets.productId, productId))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit your product profile. Changes are reflected on the public page after ISR revalidation.
        </p>
      </div>

      <ProductProfileEditor
        productId={product.id}
        productSlug={product.slug}
        initialData={{
          name: product.name,
          description: product.description,
          tagline: product.tagline,
          homepageUrl: product.homepageUrl,
          docsUrl: product.docsUrl,
          changelogUrl: product.changelogUrl,
          communityUrl: product.communityUrl,
          faq: product.faq as { question: string; answer: string }[] | null,
        }}
        categories={allCategories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
        assignedCategoryIds={assignedCatIds}
        tags={allTags.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))}
        assignedTagIds={assignedTagIds}
        assets={assets.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
      />
    </div>
  )
}
