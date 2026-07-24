import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// One-off migration script — use direct (non-pooled) endpoint.
const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!)

async function main() {
  console.log('Fixing reviews table constraints...')

  // Drop the old unique index that prevented multiple contributors per product
  await sql`DROP INDEX IF EXISTS reviews_product_idx`
  console.log('  Dropped reviews_product_idx unique index.')

  // Add composite unique constraint: one review per contributor per product
  await sql`ALTER TABLE reviews ADD CONSTRAINT reviews_product_contributor_unique UNIQUE (product_id, contributor_id)`
  console.log('  Added reviews_product_contributor_unique composite constraint.')

  // Verify
  const constraints = await sql`
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'reviews'::regclass
    AND contype = 'u'
    AND conname = 'reviews_product_contributor_unique'
  `
  console.log(`  Verification: ${constraints.length > 0 ? 'OK' : 'FAILED'}`)
}

main().catch(console.error)
