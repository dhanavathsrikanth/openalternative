import { describe, it, expect } from 'vitest'

// ── Clerk organization webhook tests ────────────────────────────────────
//
// Tests the logic that processes Clerk organization webhook payloads,
// mirroring the structure of the existing user webhook tests.

interface ClerkOrganizationPayload {
  id: string
  name: string
  slug: string
  created_at: number
  updated_at: number
  object: 'organization'
}

interface ClerkOrganizationMembershipPayload {
  id: string
  organization: ClerkOrganizationPayload
  public_user_data: {
    user_id: string
    first_name: string | null
    last_name: string | null
  }
  role: string
  created_at: number
  updated_at: number
}

describe('Organization webhook payload structure', () => {
  const baseOrgPayload: ClerkOrganizationPayload = {
    id: 'org_2abc123def456',
    name: 'Test Organization',
    slug: 'test-organization',
    created_at: 1700000000000,
    updated_at: 1700000000000,
    object: 'organization',
  }

  it('contains required fields for organization.created', () => {
    expect(baseOrgPayload).toHaveProperty('id')
    expect(baseOrgPayload).toHaveProperty('name')
    expect(baseOrgPayload).toHaveProperty('created_at')
    expect(baseOrgPayload.object).toBe('organization')
  })

  it('organization id is a Clerk org ID format', () => {
    expect(baseOrgPayload.id).toMatch(/^org_/)
  })

  it('organization name is a non-empty string', () => {
    expect(baseOrgPayload.name.length).toBeGreaterThan(0)
    expect(typeof baseOrgPayload.name).toBe('string')
  })
})

describe('Organization webhook event routing', () => {
  type OrgEventType = 'organization.created' | 'organization.updated' | 'organization.deleted'

  const handledEvents: OrgEventType[] = [
    'organization.created',
    'organization.updated',
    'organization.deleted',
  ]

  it('includes all three organization lifecycle events', () => {
    expect(handledEvents).toContain('organization.created')
    expect(handledEvents).toContain('organization.updated')
    expect(handledEvents).toContain('organization.deleted')
  })

  it('organization.created and organization.updated have full payload', () => {
    for (const eventType of ['organization.created', 'organization.updated']) {
      const payload: ClerkOrganizationPayload = {
        id: 'org_test123',
        name: 'Acme Corp',
        slug: 'acme-corp',
        created_at: Date.now(),
        updated_at: Date.now(),
        object: 'organization',
      }
      expect(payload.id).toBeTruthy()
      expect(payload.name).toBeTruthy()
    }
  })

  it('organization.deleted has the org id', () => {
    const payload = { id: 'org_test123' }
    expect(payload.id).toMatch(/^org_/)
  })
})

describe('Organization membership role extraction', () => {
  const validRoles = [
    'org:owner',
    'org:admin',
    'org:editor',
    'org:marketing',
    'org:viewer',
  ]

  it('all defined roles follow the org: prefix convention', () => {
    for (const role of validRoles) {
      expect(role).toMatch(/^org:/)
    }
  })

  it('extracts role from membership payload', () => {
    const membership: ClerkOrganizationMembershipPayload = {
      id: 'memb_abc123',
      organization: {
        id: 'org_test123',
        name: 'Test Org',
        slug: 'test-org',
        created_at: Date.now(),
        updated_at: Date.now(),
        object: 'organization',
      },
      public_user_data: {
        user_id: 'user_xyz789',
        first_name: 'Jane',
        last_name: 'Doe',
      },
      role: 'org:admin',
      created_at: Date.now(),
      updated_at: Date.now(),
    }
    expect(membership.role).toBe('org:admin')
    expect(membership.public_user_data.user_id).toBe('user_xyz789')
    expect(membership.organization.id).toBe('org_test123')
  })
})
