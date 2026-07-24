import { db } from '@/app/db'
import { Organizations, ClaimRequests, Products } from '@/app/db/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

type Props = { params: Promise<{ id: string }> }

const statusVariant: Record<string, 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  verified: 'success',
  failed: 'destructive',
}

export default async function AdminOrganizationDetailPage({ params }: Props) {
  const { id } = await params
  const orgId = Number(id)
  if (isNaN(orgId)) notFound()

  const [org] = await db
    .select()
    .from(Organizations)
    .where(eq(Organizations.id, orgId))
    .limit(1)

  if (!org) notFound()

  const claims = await db
    .select({
      id: ClaimRequests.id,
      method: ClaimRequests.method,
      status: ClaimRequests.status,
      verificationToken: ClaimRequests.verificationToken,
      createdAt: ClaimRequests.createdAt,
      productName: Products.name,
      productSlug: Products.slug,
    })
    .from(ClaimRequests)
    .innerJoin(Products, eq(ClaimRequests.productId, Products.id))
    .where(eq(ClaimRequests.organizationId, orgId))
    .orderBy(desc(ClaimRequests.createdAt))

  const claimedProducts = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
    })
    .from(Products)
    .where(eq(Products.claimedByOrgId, orgId))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">{org.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Slug: {org.slug} · Clerk ID: {org.clerkOrgId} · Created{' '}
          {org.createdAt.toLocaleDateString()}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-semibold mb-3">Claim Requests</h2>
        {claims.length === 0 ? (
          <p className="text-sm text-muted-foreground">No claim requests.</p>
        ) : (
          <div className="rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">ID</th>
                  <th className="p-3 font-medium">Product</th>
                  <th className="p-3 font-medium">Method</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.id} className="border-b last:border-0">
                    <td className="p-3">{claim.id}</td>
                    <td className="p-3">
                      <Link
                        href={`/products/${claim.productSlug}`}
                        className="font-medium hover:underline"
                      >
                        {claim.productName}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{claim.method}</td>
                    <td className="p-3">
                      <Badge variant={statusVariant[claim.status] ?? 'secondary'}>
                        {claim.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {claim.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Claimed Products</h2>
        {claimedProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No claimed products.</p>
        ) : (
          <ul className="space-y-2">
            {claimedProducts.map((p) => (
              <li key={p.id} className="rounded-lg border bg-card p-3">
                <Link href={`/products/${p.slug}`} className="font-medium hover:underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
