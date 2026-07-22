import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  // Check if search_vector column exists
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    ORDER BY ordinal_position
  `
  console.log('Products columns:')
  for (const c of cols) {
    console.log(`  ${c.column_name} (${c.data_type})`)
  }

  // Check if trigger exists
  const triggers = await sql`
    SELECT trigger_name, event_manipulation
    FROM information_schema.triggers
    WHERE event_object_table = 'products'
  `
  console.log('\nTriggers on products:')
  for (const t of triggers) {
    console.log(`  ${t.trigger_name} (${t.event_manipulation})`)
  }
}

main().catch(console.error)
