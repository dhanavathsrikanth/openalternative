'use client'

import { useCallback, useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface User {
  id: string
  staff: boolean
  clerkCreateTs: string
  createTs: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function StaffManager() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchUsers = useCallback(async (page: number, q: string) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (q) params.set('search', q)
    const res = await fetch(`/api/admin/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users)
      setPagination(data.pagination)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchUsers(1, search)
  }, [fetchUsers])

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const q = (formData.get('search') as string) || ''
    setSearch(q)
    fetchUsers(1, q)
  }

  async function toggleStaff(userId: string, current: boolean) {
    setToggling(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, staff: !current }),
      })
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, staff: !current } : u)),
        )
      }
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search by user ID..."
          className="flex h-9 w-full max-w-sm rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 h-8"
        >
          Search
        </button>
      </form>

      <p className="text-xs text-muted-foreground">
        {pagination.total} user{pagination.total !== 1 ? 's' : ''} · Page{' '}
        {pagination.page} of {pagination.totalPages}
      </p>

      {loading ? (
        <div className="rounded-radius-card border bg-card">
          <div className="border-b px-4 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b px-4 py-3 last:border-0">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20 rounded-radius-button" />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium">User ID</th>
                <th className="p-3 font-medium">Staff</th>
                <th className="p-3 font-medium">Created</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3 font-mono text-xs">{u.id}</td>
                  <td className="p-3">
                    <span
                      className={
                        u.staff
                          ? 'inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'
                      }
                    >
                      {u.staff ? 'Staff' : 'User'}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(u.createTs).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleStaff(u.id, u.staff)}
                      disabled={toggling === u.id}
                      className={
                        u.staff
                          ? 'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 h-8 disabled:opacity-50'
                          : 'inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 h-8 disabled:opacity-50'
                      }
                    >
                      {toggling === u.id
                        ? 'Saving...'
                        : u.staff
                          ? 'Revoke Staff'
                          : 'Make Staff'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {pagination.page > 1 && (
            <button
              onClick={() => fetchUsers(pagination.page - 1, search)}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Prev
            </button>
          )}
          <span className="text-muted-foreground">
            {pagination.page} / {pagination.totalPages}
          </span>
          {pagination.page < pagination.totalPages && (
            <button
              onClick={() => fetchUsers(pagination.page + 1, search)}
              className="text-muted-foreground hover:text-foreground"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
