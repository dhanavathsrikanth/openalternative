import { db } from '@/app/db'
import { AuditLogs } from '@/app/db/schema'
import { eq, like, and, desc, sql } from 'drizzle-orm'

type Props = { searchParams: Promise<{ page?: string; action?: string; entityType?: string }> }

const PAGE_SIZE = 50

export default async function AdminAuditPage({ searchParams }: Props) {
  const { page: pageStr, action: actionFilter, entityType: entityFilter } = await searchParams
  const page = Math.max(1, Number(pageStr) || 1)
  const actionQ = actionFilter?.trim() || ''
  const entityQ = entityFilter?.trim() || ''

  const conditions = []
  if (actionQ) conditions.push(like(AuditLogs.action, `%${actionQ}%`))
  if (entityQ) conditions.push(like(AuditLogs.entityType, `%${entityQ}%`))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [[{ total }], logs] = await Promise.all([
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(AuditLogs)
      .where(where),
    db
      .select()
      .from(AuditLogs)
      .where(where)
      .orderBy(desc(AuditLogs.createdAt))
      .offset((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function buildUrl(p: number, action: string, entityType: string) {
    const params = new URLSearchParams()
    params.set('page', String(p))
    if (action) params.set('action', action)
    if (entityType) params.set('entityType', entityType)
    return `/admin/audit?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Audit Log</h1>

      <form className="mb-4 flex gap-2">
        <input
          type="text"
          name="action"
          defaultValue={actionQ}
          placeholder="Filter by action..."
          className="flex h-9 w-full max-w-[200px] rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <input
          type="text"
          name="entityType"
          defaultValue={entityQ}
          placeholder="Filter by entity type..."
          className="flex h-9 w-full max-w-[200px] rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 h-8"
        >
          Filter
        </button>
      </form>

      <p className="text-xs text-muted-foreground mb-3">
        {total} entries · Page {page} of {totalPages}
      </p>

      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 font-medium">ID</th>
              <th className="p-3 font-medium">Actor</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Entity Type</th>
              <th className="p-3 font-medium">Entity ID</th>
              <th className="p-3 font-medium">Before</th>
              <th className="p-3 font-medium">After</th>
              <th className="p-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="p-3">{log.id}</td>
                <td className="p-3 font-mono text-xs">{log.actorId}</td>
                <td className="p-3">
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{log.entityType}</td>
                <td className="p-3 font-mono text-xs">{log.entityId}</td>
                <td className="p-3">
                  {log.before ? (
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        View
                      </summary>
                      <pre className="mt-1 max-w-[300px] overflow-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(log.before, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3">
                  {log.after ? (
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        View
                      </summary>
                      <pre className="mt-1 max-w-[300px] overflow-auto rounded bg-muted p-2 text-xs">
                        {JSON.stringify(log.after, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3 text-muted-foreground">
                  {log.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <a
              href={buildUrl(page - 1, actionQ, entityQ)}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Prev
            </a>
          )}
          <span className="text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={buildUrl(page + 1, actionQ, entityQ)}
              className="text-muted-foreground hover:text-foreground"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
