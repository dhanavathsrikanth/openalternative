import { db } from '@/app/db'
import { Tags, ProductTags } from '@/app/db/schema'
import { count, desc, eq } from 'drizzle-orm'
import { TagManager } from './TagManager'

export default async function AdminTagsPage() {
  const tags = await db
    .select({
      id: Tags.id,
      name: Tags.name,
      slug: Tags.slug,
      productCount: count(ProductTags.productId),
    })
    .from(Tags)
    .leftJoin(ProductTags, eq(Tags.id, ProductTags.tagId))
    .groupBy(Tags.id)
    .orderBy(desc(Tags.id))

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Tags</h1>
      <TagManager tags={tags} />
    </div>
  )
}
