import { db } from '@/app/db'
import { Categories, Tags, ProprietaryTools } from '@/app/db/schema'
import Link from 'next/link'
import { ProductEditorTabs } from '../ProductEditorTabs'
import { getContentTemplate } from '../content-template'

export default async function NewProductPage() {
  const [allCategories, allTags, allProprietaryTools] = await Promise.all([
    db.select({ id: Categories.id, name: Categories.name, slug: Categories.slug }).from(Categories).orderBy(Categories.name),
    db.select({ id: Tags.id, name: Tags.name, slug: Tags.slug }).from(Tags).orderBy(Tags.name),
    db.select({ id: ProprietaryTools.id, name: ProprietaryTools.name, url: ProprietaryTools.url }).from(ProprietaryTools).orderBy(ProprietaryTools.name),
  ])

  // Starter template for the Content tab
  const contentTemplate = getContentTemplate('')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Product</h1>
          <p className="text-sm text-muted-foreground">
            Add a new product to the directory. It will be created as a draft.
          </p>
        </div>
        <Link
          href="/admin/products"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to products
        </Link>
      </div>

      <ProductEditorTabs
        mode="create"
        allCategories={allCategories}
        allTags={allTags}
        allProprietaryTools={allProprietaryTools}
        initialContentBlocks={contentTemplate}
      />
    </div>
  )
}
