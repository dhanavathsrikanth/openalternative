import { db } from '@/app/db'
import { Reviews, Products, Contributors } from '@/app/db/schema'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { ReviewModerator } from './ReviewModerator'

export default async function AdminReviewsPage() {
  const reviews = await db
    .select({
      id: Reviews.id,
      rating: Reviews.rating,
      body: Reviews.body,
      createdAt: Reviews.createdAt,
      productName: Products.name,
      productSlug: Products.slug,
      contributorName: Contributors.displayName,
    })
    .from(Reviews)
    .innerJoin(Products, eq(Reviews.productId, Products.id))
    .innerJoin(Contributors, eq(Reviews.contributorId, Contributors.id))
    .orderBy(desc(Reviews.createdAt))

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Reviews</h1>
      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 font-medium">ID</th>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Contributor</th>
              <th className="p-3 font-medium">Rating</th>
              <th className="p-3 font-medium">Body</th>
              <th className="p-3 font-medium">Created</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-3">{r.id}</td>
                <td className="p-3">
                  <Link
                    href={`/products/${r.productSlug}`}
                    className="font-medium hover:underline"
                  >
                    {r.productName}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{r.contributorName}</td>
                <td className="p-3">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                <td className="p-3 text-muted-foreground max-w-[200px] truncate">
                  {r.body.length > 100 ? r.body.slice(0, 100) + '…' : r.body}
                </td>
                <td className="p-3 text-muted-foreground">
                  {r.createdAt.toLocaleDateString()}
                </td>
                <td className="p-3">
                  <ReviewModerator reviewId={r.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
