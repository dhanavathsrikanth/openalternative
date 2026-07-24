/**
 * One-off backfill: looks up each contributor's real email via the Clerk Backend API
 * and updates contributors.email + contributors.clerk_user_id.
 *
 * Run:  npx tsx scripts/backfill-contributor-emails.ts
 *
 * Requires CLERK_SECRET_KEY in .env.local
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

// One-off backfill script — use direct (non-pooled) endpoint.
const sql = neon(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!)
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY

if (!CLERK_SECRET_KEY) {
  console.error('CLERK_SECRET_KEY is not set in .env.local')
  process.exit(1)
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ClerkUser {
  id: string
  email_addresses: { id: string; email_address: string }[]
  primary_email_address_id: string
}

async function fetchClerkUser(userId: string): Promise<ClerkUser | null> {
  const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) return null
  return res.json() as Promise<ClerkUser>
}

function primaryEmail(user: ClerkUser): string | null {
  const primary = user.email_addresses.find((e) => e.id === user.primary_email_address_id)
  const raw = primary?.email_address ?? user.email_addresses[0]?.email_address
  if (!raw || !EMAIL_REGEX.test(raw)) return null
  return raw
}

async function main() {
  console.log('Backfilling contributor emails from Clerk API...\n')

  // Find contributors whose email doesn't look like a real email address
  const contributors = await sql`
    SELECT id, clerk_user_id, email
    FROM contributors
    WHERE email NOT LIKE '%@%'
       OR clerk_user_id IS NULL
    ORDER BY id
  `

  console.log(`Found ${contributors.length} contributors to backfill.\n`)

  let updated = 0
  let failed = 0
  let skipped = 0

  for (const row of contributors) {
    const clerkId = row.clerk_user_id ?? row.email // email might be the Clerk ID for old rows

    if (!clerkId || clerkId.includes('@')) {
      console.log(`  [SKIP] id=${row.id} — no Clerk user ID available`)
      skipped++
      continue
    }

    const user = await fetchClerkUser(clerkId)
    if (!user) {
      console.log(`  [FAIL] id=${row.id} clerk_user_id=${clerkId} — Clerk API returned error`)
      failed++
      continue
    }

    const email = primaryEmail(user)
    if (!email) {
      console.log(`  [FAIL] id=${row.id} clerk_user_id=${clerkId} — no valid email in Clerk profile`)
      failed++
      continue
    }

    await sql`
      UPDATE contributors
      SET email = ${email}, clerk_user_id = ${clerkId}
      WHERE id = ${row.id}
    `
    console.log(`  [OK]   id=${row.id} ${row.email} → ${email}`)
    updated++
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}, Skipped: ${skipped}`)
}

main().catch(console.error)
