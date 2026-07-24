import { db } from '@/app/db'
import { AuditLogs } from '@/app/db/schema'

/**
 * Transaction-wrapping audit helper.
 *
 * Runs `fn` inside a Drizzle transaction. Before calling `fn`, optionally
 * captures a `before` snapshot. After `fn` completes successfully, captures
 * an `after` snapshot and writes a row to `audit_logs`.
 *
 * The caller supplies `getSnapshot` to read the current state of the entity
 * being mutated. Both snapshots are plain JSON-serialisable objects (or null).
 *
 * Usage:
 *   const result = await withAudit(
 *     actorId,
 *     'claim.verified',
 *     'product',
 *     String(productId),
 *     () => db.select().from(Products).where(eq(Products.id, productId)).limit(1),
 *     async (tx) => { /* the actual mutation *\/ },
 *   )
 */
export async function withAudit<T>(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  getBefore: () => Promise<unknown>,
  fn: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>,
): Promise<T> {
  const before = await getBefore()

  const result = await db.transaction(async (tx) => {
    const innerResult = await fn(tx)

    // Read the after snapshot by re-running getBefore with the same tx would
    // require passing tx through, so we just capture the result of fn if it
    // returns the entity, or let the caller handle after-snapshot externally.
    // For simplicity, the after-snapshot is captured by the caller's fn.
    return innerResult
  })

  // After-snapshot: we re-read outside the transaction using the same query.
  // This is acceptable because the transaction has committed by this point.
  const after = await getBefore()

  await db.insert(AuditLogs).values({
    actorId,
    action,
    entityType,
    entityId,
    before: before as Record<string, unknown> | null,
    after: after as Record<string, unknown> | null,
  })

  return result
}

/**
 * Lightweight audit insert — use when the mutation does not run in a
 * transaction managed by this helper (e.g. cron jobs, Clerk API calls).
 * Logs the event after the fact.
 */
export async function logAudit(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  before: unknown = null,
  after: unknown = null,
): Promise<void> {
  await db.insert(AuditLogs).values({
    actorId,
    action,
    entityType,
    entityId,
    before: before as Record<string, unknown> | null,
    after: after as Record<string, unknown> | null,
  })
}
