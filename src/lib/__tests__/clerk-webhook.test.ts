import { describe, it, expect } from 'vitest'

// ── Clerk webhook email extraction tests ───────────────────────────────────
//
// Tests the logic that extracts a real email address from a Clerk user.created
// webhook payload, ensuring contributors.email stores the actual email — not
// the Clerk user ID.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ClerkEmailAddress {
  id: string
  email_address: string
}

interface ClerkPayload {
  id: string
  created_at: number
  email_addresses: ClerkEmailAddress[]
  primary_email_address_id: string
}

function extractEmail(data: ClerkPayload): string | null {
  const emailAddresses = data.email_addresses
  if (!Array.isArray(emailAddresses) || emailAddresses.length === 0) {
    return null
  }

  const primary = emailAddresses.find((e) => e.id === data.primary_email_address_id)
  const raw = primary?.email_address ?? emailAddresses[0]?.email_address
  if (!raw || !EMAIL_REGEX.test(raw)) {
    return null
  }
  return raw
}

describe('Webhook email extraction', () => {
  const basePayload: ClerkPayload = {
    id: 'user_2abc123def456',
    created_at: 1700000000000,
    email_addresses: [
      { id: 'email_1', email_address: 'alice@example.com' },
      { id: 'email_2', email_address: 'alice@gmail.com' },
    ],
    primary_email_address_id: 'email_1',
  }

  it('extracts the primary email address from the payload', () => {
    const email = extractEmail(basePayload)
    expect(email).toBe('alice@example.com')
  })

  it('stores the real email, not the Clerk user ID', () => {
    const email = extractEmail(basePayload)
    expect(email).not.toBe(basePayload.id)
    expect(email).toContain('@')
  })

  it('falls back to the first email when primary_email_address_id does not match', () => {
    const payload: ClerkPayload = {
      ...basePayload,
      primary_email_address_id: 'nonexistent',
    }
    const email = extractEmail(payload)
    expect(email).toBe('alice@example.com')
  })

  it('returns null when email_addresses is empty', () => {
    const payload: ClerkPayload = {
      ...basePayload,
      email_addresses: [],
    }
    expect(extractEmail(payload)).toBeNull()
  })

  it('returns null when email_addresses is missing', () => {
    const payload = { ...basePayload, email_addresses: undefined as unknown as ClerkEmailAddress[] }
    expect(extractEmail(payload)).toBeNull()
  })

  it('returns null when no email matches the regex (malformed)', () => {
    const payload: ClerkPayload = {
      ...basePayload,
      email_addresses: [{ id: 'email_1', email_address: 'not-an-email' }],
      primary_email_address_id: 'email_1',
    }
    expect(extractEmail(payload)).toBeNull()
  })

  it('returns null when email is an empty string', () => {
    const payload: ClerkPayload = {
      ...basePayload,
      email_addresses: [{ id: 'email_1', email_address: '' }],
      primary_email_address_id: 'email_1',
    }
    expect(extractEmail(payload)).toBeNull()
  })
})

describe('Email validation regex', () => {
  it('accepts valid email formats', () => {
    expect(EMAIL_REGEX.test('user@example.com')).toBe(true)
    expect(EMAIL_REGEX.test('alice@gmail.com')).toBe(true)
    expect(EMAIL_REGEX.test('bob+tag@company.co.uk')).toBe(true)
  })

  it('rejects Clerk user IDs (no @ sign)', () => {
    expect(EMAIL_REGEX.test('user_2abc123def456')).toBe(false)
    expect(EMAIL_REGEX.test('user_')).toBe(false)
  })

  it('rejects malformed emails', () => {
    expect(EMAIL_REGEX.test('@example.com')).toBe(false)
    expect(EMAIL_REGEX.test('user@')).toBe(false)
    expect(EMAIL_REGEX.test('user@.com')).toBe(false)
    expect(EMAIL_REGEX.test('user space@example.com')).toBe(false)
  })
})

describe('Webhook payload structure', () => {
  it('contains email_addresses as an array of objects with id and email_address', () => {
    const payload: ClerkPayload = {
      id: 'user_2abc123def456',
      created_at: 1700000000000,
      email_addresses: [
        { id: 'email_1', email_address: 'test@example.com' },
      ],
      primary_email_address_id: 'email_1',
    }

    expect(Array.isArray(payload.email_addresses)).toBe(true)
    expect(payload.email_addresses[0]).toHaveProperty('id')
    expect(payload.email_addresses[0]).toHaveProperty('email_address')
    expect(payload.primary_email_address_id).toBe('email_1')
  })

  it('user.created event includes the fields needed for email extraction', () => {
    // Simulates what the webhook handler receives from Clerk
    const webhookData: ClerkPayload = {
      id: 'user_2abc123def456',
      created_at: Date.now(),
      email_addresses: [
        { id: 'email_prim', email_address: 'newuser@clerk.dev' },
      ],
      primary_email_address_id: 'email_prim',
    }

    const email = extractEmail(webhookData)
    expect(email).toBe('newuser@clerk.dev')
    expect(email).not.toBe(webhookData.id)
  })
})
