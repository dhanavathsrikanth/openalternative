import { db } from '@/app/db'
import { Announcements, Products } from '@/app/db/schema'
import { desc, eq } from 'drizzle-orm'
import { AnnouncementModerator } from './AnnouncementModerator'

export default async function AdminAnnouncementsPage() {
  const announcements = await db
    .select({
      id: Announcements.id,
      title: Announcements.title,
      body: Announcements.body,
      publishedAt: Announcements.publishedAt,
      createdAt: Announcements.createdAt,
      productName: Products.name,
    })
    .from(Announcements)
    .innerJoin(Products, eq(Announcements.productId, Products.id))
    .orderBy(desc(Announcements.createdAt))

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Announcements</h1>
      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 font-medium">ID</th>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Body</th>
              <th className="p-3 font-medium">Published</th>
              <th className="p-3 font-medium">Created</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((a) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="p-3">{a.id}</td>
                <td className="p-3 font-medium">{a.productName}</td>
                <td className="p-3">{a.title}</td>
                <td className="p-3 text-muted-foreground max-w-[200px] truncate">
                  {a.body.length > 100 ? a.body.slice(0, 100) + '…' : a.body}
                </td>
                <td className="p-3 text-muted-foreground">
                  {a.publishedAt?.toLocaleDateString() ?? '—'}
                </td>
                <td className="p-3 text-muted-foreground">
                  {a.createdAt.toLocaleDateString()}
                </td>
                <td className="p-3">
                  <AnnouncementModerator announcementId={a.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
