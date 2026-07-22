import { NextRequest, NextResponse } from 'next/server'

/**
 * Verify the request carries the shared cron secret.
 */
export function verifySecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('CRON_SECRET env var is not set')
    return false
  }
  return req.headers.get('authorization') === `Bearer ${secret}`
}

/**
 * Return 401 if the secret is missing/invalid.
 */
export function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}
