import { requireStaff } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/app/db'
import { Organizations } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { AdminNav } from './AdminNav'

type LayoutProps = { children: React.ReactNode }

export default async function AdminLayout({ children }: LayoutProps) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    redirect('/')
  }

  const orgRows = await db
    .select({ slug: Organizations.slug })
    .from(Organizations)
    .where(eq(Organizations.clerkOrgId, ctx.orgId))
    .limit(1)

  const orgSlug = orgRows[0]?.slug ?? null

  return (
    <div className="flex min-h-screen">
      <aside className="sidebar py-4">
        <div className="px-5 pb-4">
          <h2 className="text-sm font-semibold">Admin Panel</h2>
        </div>
        <AdminNav orgSlug={orgSlug} />
      </aside>
      <main className="main-content p-8">{children}</main>
    </div>
  )
}
