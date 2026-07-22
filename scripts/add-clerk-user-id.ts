import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL!)

async function main() {
  console.log('Adding clerk_user_id column to contributors...')

  // Add the column
  await sql`ALTER TABLE contributors ADD COLUMN IF NOT EXISTS clerk_user_id text`
  console.log('  Column added.')

  // Create partial unique index (WHERE clerk_user_id IS NOT NULL so NULLs don't conflict)
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS contributors_clerk_user_id_idx
    ON contributors (clerk_user_id)
    WHERE clerk_user_id IS NOT NULL
  `
  console.log('  Unique index created.')

  // Backfill: copy Clerk user IDs from the email column where email has no @ (i.e. it's a Clerk ID)
  const backfilled = await sql`
    UPDATE contributors
    SET clerk_user_id = email
    WHERE email NOT LIKE '%@%'
      AND clerk_user_id IS NULL
  `
  console.log(`  Backfilled rows with Clerk user IDs from email column.`)

  // Report rows with potentially invalid emails (no @ sign, and wasn't a Clerk ID)
  const invalidEmails = await sql`
    SELECT id, clerk_user_id, email
    FROM contributors
    WHERE email NOT LIKE '%@%'
  `
  if (invalidEmails.length > 0) {
    console.log(`  WARNING: ${invalidEmails.length} rows still have invalid emails (no @):`)
    for (const row of invalidEmails) {
      console.log(`    id=${row.id} clerk_user_id=${row.clerk_user_id} email=${row.email}`)
    }
  } else {
    console.log('  All rows have valid email addresses.')
  }

  // Verify
  const cols = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'contributors' AND column_name = 'clerk_user_id'
  `
  console.log(`  Column verification: ${cols.length > 0 ? 'OK' : 'FAILED'}`)
}

main().catch(console.error)
