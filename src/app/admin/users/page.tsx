import { db } from '@/app/db'
import { Contributors } from '@/app/db/schema'
import { desc, ilike, or, sql } from 'drizzle-orm'
import Link from 'next/link'

type Props = { searchParams: Promise<{ page?: string; search?: string }> }

const PAGE_SIZE = 20

export default async function AdminUsersPage({ searchParams }: Props) {
  const { page: pageStr, search } = await searchParams
  const page = Math.max(1, Number(pageStr) || 1)
  const searchFilter = search?.trim() || ''

  const where = searchFilter
    ? or(
        ilike(Contributors.displayName, `%${searchFilter}%`),
        ilike(Contributors.email, `%${searchFilter}%`),
      )
    : undefined

  const [[{ total }], users] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(Contributors)
      .where(where),
    db
      .select()
      .from(Contributors)
      .where(where)
      .orderBy(desc(Contributors.createdAt))
      .offset((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function buildUrl(p: number) {
    const params = new URLSearchParams()
    params.set('page', String(p))
    if (searchFilter) params.set('search', searchFilter)
    return `/admin/users?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Users</h1>

      <form className="mb-4 flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={searchFilter}
          placeholder="Search by name or email..."
          className="flex h-9 w-full max-w-sm rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 h-8"
        >
          Search
        </button>
      </form>

      <p className="text-xs text-muted-foreground mb-3">
        {total} contributor{total !== 1 ? 's' : ''} · Page {page} of {totalPages}
      </p>

      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 font-medium">ID</th>
              <th className="p-3 font-medium">Display Name</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Clerk User ID</th>
              <th className="p-3 font-medium">Rep</th>
              <th className="p-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="p-3">{u.id}</td>
                <td className="p-3 font-medium">{u.displayName}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3 font-mono text-xs text-muted-foreground">
                  {u.clerkUserId ?? '—'}
                </td>
                <td className="p-3">{u.reputationPoints}</td>
                <td className="p-3 text-muted-foreground">
                  {u.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={buildUrl(page - 1)} className="text-muted-foreground hover:text-foreground">
              ← Prev
            </Link>
          )}
          <span className="text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildUrl(page + 1)} className="text-muted-foreground hover:text-foreground">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
