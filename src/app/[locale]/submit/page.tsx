import { db } from '@/app/db'
import { Categories, Tags } from '@/app/db/schema'
import { SubmitForm } from './SubmitForm'

export default async function SubmitPage() {
  const [categories, tags] = await Promise.all([
    db.select({ id: Categories.id, name: Categories.name }).from(Categories).orderBy(Categories.name),
    db.select({ id: Tags.id, name: Tags.name }).from(Tags).orderBy(Tags.name),
  ])

  return <SubmitForm categories={categories} tags={tags} />
}
