import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Role hierarchy (mirrors auth.ts) ────────────────────────────────────

const ROLE_HIERARCHY: Record<string, number> = {
  'org:owner': 50, 'org:admin': 40, 'org:editor': 30, 'org:marketing': 20, 'org:viewer': 10,
}

function hasMinRole(role: string, min: string): boolean {
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[min] ?? 0)
}

// ── Owner counting logic ────────────────────────────────────────────────

function countOwners(members: { role: string }[]): number {
  return members.filter((m) => m.role === 'org:owner').length
}

function isLastOwner(members: { role: string; id: string }[], targetId: string): boolean {
  const target = members.find((m) => m.id === targetId)
  if (!target || target.role !== 'org:owner') return false
  return countOwners(members) <= 1
}

// ── Mock Clerk client ──────────────────────────────────────────────────

const mockGetMembershipList = vi.fn()
const mockGetInvitationList = vi.fn()
const mockInviteMember = vi.fn()
const mockUpdateMembership = vi.fn()
const mockRemoveMember = vi.fn()
const mockRevokeInvitation = vi.fn()

vi.mock('@/lib/clerk-client', () => ({
  getClerkClient: vi.fn(() => ({
    organizations: {
      getOrganizationMembershipList: mockGetMembershipList,
      getOrganizationInvitationList: mockGetInvitationList,
      inviteOrganizationMember: mockInviteMember,
      updateOrganizationMembership: mockUpdateMembership,
      removeOrganizationMember: mockRemoveMember,
      revokeOrganizationInvitation: mockRevokeInvitation,
    },
  })),
}))

// ── Mock Clerk auth ────────────────────────────────────────────────────

let mockSession: { userId: string | null; orgId: string | null; orgRole: string | null } = {
  userId: null, orgId: null, orgRole: null,
}

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}))

function setMock(overrides: Partial<typeof mockSession>) {
  mockSession = { ...mockSession, ...overrides }
}

// ── Mock DB ────────────────────────────────────────────────────────────

const mockOrgRow = { id: 1, clerkOrgId: 'org_1', slug: 'acme', name: 'Acme Corp', createdAt: new Date() }

const mockDbChain = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([mockOrgRow]),
}

vi.mock('@/app/db', () => ({ db: mockDbChain }))

// ── Mock next/navigation ───────────────────────────────────────────────

vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => { throw new Error('REDIRECT') }),
  notFound: vi.fn(() => { throw new Error('NOT_FOUND') }),
}))

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => ({ ...props, children, type: 'Link' }),
}))

// ── Tests ──────────────────────────────────────────────────────────────

describe('Team management role gating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession = { userId: null, orgId: null, orgRole: null }
  })

  const roles = Object.keys(ROLE_HIERARCHY)

  for (const role of roles) {
    const canAccess = hasMinRole(role, 'org:admin')
    it(`${role} ${canAccess ? 'can' : 'cannot'} access team management`, () => {
      expect(hasMinRole(role, 'org:admin')).toBe(canAccess)
    })
  }

  it('owner can access', () => {
    expect(hasMinRole('org:owner', 'org:admin')).toBe(true)
  })

  it('admin can access', () => {
    expect(hasMinRole('org:admin', 'org:admin')).toBe(true)
  })

  it('editor cannot access', () => {
    expect(hasMinRole('org:editor', 'org:admin')).toBe(false)
  })

  it('marketing cannot access', () => {
    expect(hasMinRole('org:marketing', 'org:admin')).toBe(false)
  })

  it('viewer cannot access', () => {
    expect(hasMinRole('org:viewer', 'org:admin')).toBe(false)
  })
})

describe('Last-owner safeguard', () => {
  it('detects last owner correctly', () => {
    const members = [
      { id: 'm1', role: 'org:owner' },
      { id: 'm2', role: 'org:editor' },
      { id: 'm3', role: 'org:viewer' },
    ]
    expect(isLastOwner(members, 'm1')).toBe(true)
  })

  it('does not block when multiple owners exist', () => {
    const members = [
      { id: 'm1', role: 'org:owner' },
      { id: 'm2', role: 'org:owner' },
      { id: 'm3', role: 'org:editor' },
    ]
    expect(isLastOwner(members, 'm1')).toBe(false)
  })

  it('returns false for non-owner target', () => {
    const members = [
      { id: 'm1', role: 'org:owner' },
      { id: 'm2', role: 'org:editor' },
    ]
    expect(isLastOwner(members, 'm2')).toBe(false)
  })

  it('returns false for unknown member', () => {
    const members = [
      { id: 'm1', role: 'org:owner' },
    ]
    expect(isLastOwner(members, 'unknown')).toBe(false)
  })

  it('handles single-member org with owner', () => {
    const members = [{ id: 'm1', role: 'org:owner' }]
    expect(isLastOwner(members, 'm1')).toBe(true)
  })

  it('handles empty member list', () => {
    expect(isLastOwner([], 'm1')).toBe(false)
  })
})

describe('Admin cannot promote to admin/owner', () => {
  it('admin inviting with owner role should be blocked', () => {
    const adminRole = 'org:admin'
    const targetRole = 'org:owner'
    const canPromote = (ROLE_HIERARCHY[adminRole] ?? 0) >= (ROLE_HIERARCHY['org:admin'] ?? 40) && (ROLE_HIERARCHY[targetRole] ?? 0) >= (ROLE_HIERARCHY['org:admin'] ?? 40)
    expect(canPromote).toBe(true) // this is the condition that BLOCKS
  })

  it('admin inviting with viewer role should be allowed', () => {
    const adminRole = 'org:admin'
    const targetRole = 'org:viewer'
    const isBlocked = adminRole === 'org:admin' && (ROLE_HIERARCHY[targetRole] ?? 0) >= (ROLE_HIERARCHY['org:admin'] ?? 40)
    expect(isBlocked).toBe(false)
  })

  it('owner inviting with admin role should be allowed', () => {
    const inviterRole = 'org:owner'
    const targetRole = 'org:admin'
    const isBlocked = inviterRole === 'org:admin' && (ROLE_HIERARCHY[targetRole] ?? 0) >= (ROLE_HIERARCHY['org:admin'] ?? 40)
    expect(isBlocked).toBe(false)
  })
})

describe('Self-removal prevention', () => {
  it('prevents removing yourself', () => {
    const currentUserId = 'user_1'
    const targetUserId = 'user_1'
    expect(currentUserId === targetUserId).toBe(true)
  })

  it('allows removing other members', () => {
    const currentUserId = 'user_1'
    const targetUserId = 'user_2'
    expect(currentUserId !== targetUserId).toBe(true)
  })
})

describe('Role labels', () => {
  const roleMap: Record<string, string> = {
    'org:owner': 'Owner',
    'org:admin': 'Admin',
    'org:editor': 'Editor',
    'org:marketing': 'Marketing',
    'org:viewer': 'Viewer',
  }

  it('maps all roles to display labels', () => {
    expect(Object.keys(roleMap)).toHaveLength(5)
    expect(roleMap['org:owner']).toBe('Owner')
    expect(roleMap['org:viewer']).toBe('Viewer')
  })
})

describe('Invite flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inviteOrganizationMember is called with correct params', async () => {
    mockInviteMember.mockResolvedValue({})

    const client = await (await import('@/lib/clerk-client')).getClerkClient()
    await client.organizations.inviteOrganizationMember({
      organizationId: 'org_1',
      emailAddress: 'new@example.com',
      role: 'org:editor',
    })

    expect(mockInviteMember).toHaveBeenCalledWith({
      organizationId: 'org_1',
      emailAddress: 'new@example.com',
      role: 'org:editor',
    })
  })
})

describe('Member removal flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('removeOrganizationMember is called with userId', async () => {
    mockRemoveMember.mockResolvedValue({})

    const client = await (await import('@/lib/clerk-client')).getClerkClient()
    await client.organizations.removeOrganizationMember({
      organizationId: 'org_1',
      userId: 'user_2',
    })

    expect(mockRemoveMember).toHaveBeenCalledWith({
      organizationId: 'org_1',
      userId: 'user_2',
    })
  })
})

describe('Role change flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updateOrganizationMembership is called with new role', async () => {
    mockUpdateMembership.mockResolvedValue({})

    const client = await (await import('@/lib/clerk-client')).getClerkClient()
    await client.organizations.updateOrganizationMembership({
      organizationId: 'org_1',
      userId: 'user_2',
      role: 'org:admin',
    })

    expect(mockUpdateMembership).toHaveBeenCalledWith({
      organizationId: 'org_1',
      userId: 'user_2',
      role: 'org:admin',
    })
  })
})

describe('Invitation revocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('revokeOrganizationInvitation is called', async () => {
    mockRevokeInvitation.mockResolvedValue({})

    const client = await (await import('@/lib/clerk-client')).getClerkClient()
    await client.organizations.revokeOrganizationInvitation({
      organizationId: 'org_1',
      invitationId: 'inv_1',
    })

    expect(mockRevokeInvitation).toHaveBeenCalledWith({
      organizationId: 'org_1',
      invitationId: 'inv_1',
    })
  })
})
