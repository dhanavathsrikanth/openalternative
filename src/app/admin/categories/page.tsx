import { db } from '@/app/db'
import { Categories, ProductCategories } from '@/app/db/schema'
import { count, desc, eq } from 'drizzle-orm'
import { CategoryManager } from './CategoryManager'

export default async function AdminCategoriesPage() {
  const categories = await db
    .select({
      id: Categories.id,
      name: Categories.name,
      slug: Categories.slug,
      description: Categories.description,
      seoTitle: Categories.seoTitle,
      seoDescription: Categories.seoDescription,
      seoCanonicalUrl: Categories.seoCanonicalUrl,
      productCount: count(ProductCategories.productId),
    })
    .from(Categories)
    .leftJoin(ProductCategories, eq(Categories.id, ProductCategories.categoryId))
    .groupBy(Categories.id)
    .orderBy(desc(Categories.id))

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Categories</h1>
      <CategoryManager categories={categories} />
    </div>
  )
}
