import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Fixing contributions table constraints...')

  // Count existing rows before migration
  const before = await sql`SELECT count(*)::int AS count FROM contributions`
  console.log(`  Rows before migration: ${before[0].count}`)

  // Drop the old unique index that limited one contribution per product
  await sql`DROP INDEX IF EXISTS contributions_product_idx`
  console.log('  Dropped contributions_product_idx unique index.')

  // Add partial unique index: prevent same contributor from having two pending
  // contributions on the same product simultaneously
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS contributions_pending_per_contributor_idx
    ON contributions (product_id, contributor_id)
    WHERE status = 'pending'
  `
  console.log('  Created contributions_pending_per_contributor_idx partial unique index.')

  // Verify no rows were lost
  const after = await sql`SELECT count(*)::int AS count FROM contributions`
  console.log(`  Rows after migration: ${after[0].count}`)
  console.log(`  Data integrity: ${before[0].count === after[0].count ? 'OK' : 'FAILED - rows lost!'}`)

  // Verify the new index exists
  const indexes = await sql`
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = 'contributions'
    AND indexname = 'contributions_pending_per_contributor_idx'
  `
  console.log(`  New index verification: ${indexes.length > 0 ? 'OK' : 'FAILED'}`)

  // Verify the old index is gone
  const oldIndex = await sql`
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = 'contributions'
    AND indexname = 'contributions_product_idx'
  `
  console.log(`  Old index removal: ${oldIndex.length === 0 ? 'OK' : 'FAILED - still exists!'}`)
}

main().catch(console.error)
