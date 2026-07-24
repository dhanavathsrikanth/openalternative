import { db } from '@/app/db'
import { Organizations, ClaimRequests } from '@/app/db/schema'
import { eq, count, desc } from 'drizzle-orm'
import Link from 'next/link'

export default async function AdminOrganizationsPage() {
  const orgs = await db
    .select({
      id: Organizations.id,
      name: Organizations.name,
      slug: Organizations.slug,
      clerkOrgId: Organizations.clerkOrgId,
      createdAt: Organizations.createdAt,
      claimCount: count(ClaimRequests.id),
    })
    .from(Organizations)
    .leftJoin(ClaimRequests, eq(Organizations.id, ClaimRequests.organizationId))
    .groupBy(Organizations.id)
    .orderBy(desc(Organizations.createdAt))

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Organizations</h1>
      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 font-medium">ID</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Clerk Org ID</th>
              <th className="p-3 font-medium">Claims</th>
              <th className="p-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-b last:border-0">
                <td className="p-3">{org.id}</td>
                <td className="p-3">
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="font-medium hover:underline"
                  >
                    {org.name}
                  </Link>
                </td>
                <td className="p-3 text-muted-foreground">{org.slug}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">
                  {org.clerkOrgId}
                </td>
                <td className="p-3">{org.claimCount}</td>
                <td className="p-3 text-muted-foreground">
                  {org.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
