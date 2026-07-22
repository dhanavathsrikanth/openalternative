import { db } from '@/app/db'
import { RawSignals } from '@/app/db/schema'
import { eq, and, gte } from 'drizzle-orm'
import type { sourceEnum } from '@/app/db/schema'

type Source = typeof sourceEnum.enumValues[number]

export { verifySecret, unauthorized } from '@/lib/cron-auth'

const DEDUP_HOURS = 22

/**
 * Check whether we already have a recent signal for this identifier.
 */
export async function alreadyFetched(source: Source, repoIdentifier: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - DEDUP_HOURS * 60 * 60 * 1000)
  const rows = await db
    .select({ id: RawSignals.id })
    .from(RawSignals)
    .where(
      and(
        eq(RawSignals.source, source),
        eq(RawSignals.repoIdentifier, repoIdentifier),
        gte(RawSignals.fetchedAt, cutoff),
      ),
    )
    .limit(1)
  return rows.length > 0
}

/**
 * Insert a raw signal row. Append-only — never updates.
 */
export async function insertSignal(
  source: Source,
  repoIdentifier: string,
  payload: unknown,
) {
  await db.insert(RawSignals).values({
    source,
    repoIdentifier,
    payload,
    processed: false,
  })
}

/**
 * Run a batch ingestion job over a list of identifiers.
 * - Skips identifiers fetched within the last DEDUP_HOURS.
 * - Catches per-item errors so one failure doesn't abort the batch.
 */
export async function runBatch<T>(
  source: Source,
  items: T[],
  fetchFn: (item: T) => Promise<{ identifier: string; payload: unknown }>,
): Promise<{ fetched: number; skipped: number; errors: string[] }> {
  let fetched = 0
  let skipped = 0
  const errors: string[] = []

  for (const item of items) {
    try {
      const identifier =
        typeof item === 'object' && item !== null
          ? (item as Record<string, string>).name ||
            `${(item as Record<string, string>).owner}/${(item as Record<string, string>).repo}`
          : String(item)

      if (await alreadyFetched(source, identifier)) {
        skipped++
        continue
      }

      const { payload } = await fetchFn(item)
      await insertSignal(source, identifier, payload)
      fetched++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[${source}] Error processing item:`, msg)
      errors.push(msg)
    }
  }

  return { fetched, skipped, errors }
}
