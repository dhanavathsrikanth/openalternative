import { db } from '@/app/db'
import { Products, Organizations, ProductAssets, ProductContent, ProductCategories, ProductTags, ProductAlternatives, ProprietaryTools, Categories, Tags } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProductEditorTabs } from '../ProductEditorTabs'
import { ContentGenerator } from './ContentGenerator'
import { ContentReview } from './ContentReview'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminProductPage({ params }: PageProps) {
  const { id } = await params
  const productId = Number(id)

  if (Number.isNaN(productId)) notFound()

  const [product] = await db
    .select()
    .from(Products)
    .where(eq(Products.id, productId))
    .limit(1)

  if (!product) notFound()

  let orgName: string | null = null
  if (product.claimedByOrgId) {
    const [org] = await db
      .select()
      .from(Organizations)
      .where(eq(Organizations.id, product.claimedByOrgId))
      .limit(1)
    orgName = org?.name ?? null
  }

  const [assets, initialCategoryIds, initialTagIds, allCategories, allTags, contentRows, initialProprietaryToolIds, allProprietaryTools] = await Promise.all([
    db.select().from(ProductAssets).where(eq(ProductAssets.productId, productId)),
    db.select({ categoryId: ProductCategories.categoryId })
      .from(ProductCategories)
      .where(eq(ProductCategories.productId, productId))
      .then((rows) => rows.map((r) => r.categoryId)),
    db.select({ tagId: ProductTags.tagId })
      .from(ProductTags)
      .where(eq(ProductTags.productId, productId))
      .then((rows) => rows.map((r) => r.tagId)),
    db.select({ id: Categories.id, name: Categories.name, slug: Categories.slug }).from(Categories).orderBy(Categories.name),
    db.select({ id: Tags.id, name: Tags.name, slug: Tags.slug }).from(Tags).orderBy(Tags.name),
    db.select().from(ProductContent).where(eq(ProductContent.productId, productId)),
    db.select({ proprietaryToolId: ProductAlternatives.proprietaryToolId })
      .from(ProductAlternatives)
      .where(eq(ProductAlternatives.productId, productId))
      .then((rows) => rows.map((r) => r.proprietaryToolId)),
    db.select({ id: ProprietaryTools.id, name: ProprietaryTools.name, url: ProprietaryTools.url }).from(ProprietaryTools).orderBy(ProprietaryTools.name),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-sm text-muted-foreground">/{product.slug}</p>
        </div>
        <Link
          href="/admin/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to products
        </Link>
      </div>

      {orgName && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          Claimed by: <span className="font-medium">{orgName}</span>{' '}
          <span className="text-muted-foreground">(org #{product.claimedByOrgId})</span>
        </div>
      )}

      <ProductEditorTabs
        mode="edit"
        initialProduct={product}
        initialCategoryIds={initialCategoryIds}
        initialTagIds={initialTagIds}
        initialProprietaryToolIds={initialProprietaryToolIds}
        allProprietaryTools={allProprietaryTools}
        initialAssets={assets.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
        allCategories={allCategories}
        allTags={allTags}
        initialContentBlocks={product.contentBlocks as unknown[] | null}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">AI Content Generation</h2>
        <ContentGenerator productId={product.id} />
      </section>

      <ContentReview productId={product.id} initialContent={contentRows} />
    </div>
  )
}
