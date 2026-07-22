import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { verifySecret } from '@/lib/cron-auth'

describe('verifySecret', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.CRON_SECRET = 'test-secret-123'
  })

  it('returns true for valid authorization header', () => {
    const req = new NextRequest('http://localhost', {
      headers: { authorization: 'Bearer test-secret-123' },
    })
    expect(verifySecret(req)).toBe(true)
  })

  it('returns false for invalid authorization header', () => {
    const req = new NextRequest('http://localhost', {
      headers: { authorization: 'Bearer wrong-secret' },
    })
    expect(verifySecret(req)).toBe(false)
  })

  it('returns false when no authorization header', () => {
    const req = new NextRequest('http://localhost')
    expect(verifySecret(req)).toBe(false)
  })

  it('returns false when CRON_SECRET is not set', () => {
    delete process.env.CRON_SECRET
    const req = new NextRequest('http://localhost', {
      headers: { authorization: 'Bearer test-secret-123' },
    })
    expect(verifySecret(req)).toBe(false)
  })
})
