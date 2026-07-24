import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!)

const CLERK_USER_ID = 'user_3GopvIzkaHPR6hsS7SbJToegnLN'

async function main() {
  console.log(`Ensuring user ${CLERK_USER_ID} exists in users table...`)

  await sql`
    INSERT INTO users (id, staff, clerk_create_ts, create_ts)
    VALUES (${CLERK_USER_ID}, true, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET staff = true
  `

  console.log('User is now staff.')

  const rows = await sql`SELECT id, staff FROM users WHERE id = ${CLERK_USER_ID}`
  console.log('Verification:', rows[0])
}

main().catch(console.error)
