import { db } from '@/app/db'
import { Collections, CollectionProducts } from '@/app/db/schema'
import { count, desc, eq } from 'drizzle-orm'
import { CollectionManager } from './CollectionManager'

export default async function AdminCollectionsPage() {
  const collections = await db
    .select({
      id: Collections.id,
      title: Collections.title,
      slug: Collections.slug,
      curationType: Collections.curationType,
      createdAt: Collections.createdAt,
      productCount: count(CollectionProducts.productId),
    })
    .from(Collections)
    .leftJoin(CollectionProducts, eq(Collections.id, CollectionProducts.collectionId))
    .groupBy(Collections.id)
    .orderBy(desc(Collections.createdAt))

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Collections</h1>
      <CollectionManager collections={collections} />
    </div>
  )
}
