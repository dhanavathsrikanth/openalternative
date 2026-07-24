import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// One-off migration script — use direct (non-pooled) endpoint.
const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!)

async function main() {
  console.log('Adding search_vector column to products...')
  
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector`
  console.log('  Column added.')

  // Populate from existing rows
  await sql`
    UPDATE products SET search_vector =
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(license, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(primary_language, '')), 'C')
  `
  console.log('  Existing rows populated.')

  // Verify
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'search_vector'
  `
  console.log(`  Verification: ${cols.length > 0 ? 'OK' : 'FAILED'}`)
}

main().catch(console.error)
