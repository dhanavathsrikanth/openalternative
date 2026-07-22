import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('=== DATABASE DIAGNOSIS ===')
  console.log('DATABASE_URL host:', new URL(process.env.DATABASE_URL!).hostname)
  console.log('NEON_BRANCH env:', process.env.NEON_BRANCH || '(not set)')
  console.log()

  // Check current database/branch
  const dbCheck = await sql`SELECT current_database(), current_schema()`
  console.log('Current database:', dbCheck[0].current_database)
  console.log('Current schema:', dbCheck[0].current_schema)
  console.log()

  // Count products
  const productCount = await sql`SELECT count(*)::int as count FROM products`
  console.log('Products count:', productCount[0].count)

  // Count by status
  const statusBreakdown = await sql`SELECT status, count(*)::int as count FROM products GROUP BY status ORDER BY count DESC`
  console.log('Products by status:')
  for (const row of statusBreakdown) {
    console.log(`  ${row.status}: ${row.count}`)
  }
  console.log()

  // Count categories
  const categoryCount = await sql`SELECT count(*)::int as count FROM categories`
  console.log('Categories count:', categoryCount[0].count)
  console.log()

  // Count other tables
  const rawCount = await sql`SELECT count(*)::int as count FROM raw_signals`
  console.log('Raw signals count:', rawCount[0].count)
  const processedCount = await sql`SELECT count(*)::int as count FROM raw_signals WHERE processed = true`
  console.log('Raw signals processed:', processedCount[0].count)
  const unprocessedCount = await sql`SELECT count(*)::int as count FROM raw_signals WHERE processed = false`
  console.log('Raw signals unprocessed:', unprocessedCount[0].count)
  console.log()

  // Sample products if any exist
  if (productCount[0].count > 0) {
    const sample = await sql`SELECT id, name, slug, status, confidence_score FROM products LIMIT 5`
    console.log('Sample products:')
    for (const row of sample) {
      console.log(`  [${row.status}] ${row.name} (slug: ${row.slug}, score: ${row.confidence_score})`)
    }
  }

  // Check tables exist
  const tables = await sql`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `
  console.log()
  console.log('All tables:')
  for (const row of tables) {
    console.log(`  ${row.table_name}`)
  }
}

main().catch(console.error)
