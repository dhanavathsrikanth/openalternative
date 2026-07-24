import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Clerk auth ────────────────────────────────────────────────────

const { mockSession, setMockSession, clearMockSession } = vi.hoisted(() => {
  const mockSession: { userId: string | null; orgId: string | null; orgRole: string | null } = {
    userId: null, orgId: null, orgRole: null,
  }
  return {
    mockSession,
    setMockSession(overrides: Partial<typeof mockSession>) {
      Object.assign(mockSession, overrides)
    },
    clearMockSession() {
      mockSession.userId = null
      mockSession.orgId = null
      mockSession.orgRole = null
    },
  }
})

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}))

// ── Mock DB ────────────────────────────────────────────────────────────

const { mockStaffValue, mockDbChain } = vi.hoisted(() => {
  const state = { mockStaffValue: null as boolean | null }
  const mockDbChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(() => {
      if (state.mockStaffValue === null) return Promise.resolve([])
      return Promise.resolve([{ staff: state.mockStaffValue }])
    }),
  }
  return { mockStaffValue: state, mockDbChain }
})

vi.mock('@/app/db', () => ({ db: mockDbChain }))

// ── Mock @/app/db/schema ────────────────────────────────────────────────

vi.mock('@/app/db/schema', () => ({
  Users: { staff: 'staff' },
}))

// ── Import after mocks ─────────────────────────────────────────────────

import { requireStaff, AuthError } from '@/lib/auth'

// ── Tests ──────────────────────────────────────────────────────────────

describe('Staff flag: completely separate from vendor roles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearMockSession()
    mockStaffValue.mockStaffValue = null
  })

  it('requireStaff succeeds for staff=true user', async () => {
    setMockSession({ userId: 'user_staff1', orgId: 'org_1', orgRole: 'org:viewer' })
    mockStaffValue.mockStaffValue = true
    const ctx = await requireStaff()
    expect(ctx.userId).toBe('user_staff1')
  })

  it('requireStaff throws for staff=false user (even if org:owner)', async () => {
    setMockSession({ userId: 'user_owner', orgId: 'org_1', orgRole: 'org:owner' })
    mockStaffValue.mockStaffValue = false
    await expect(requireStaff()).rejects.toThrow(AuthError)
    await expect(requireStaff()).rejects.toThrow('Staff access required.')
  })

  it('requireStaff throws for staff=false user (org:admin)', async () => {
    setMockSession({ userId: 'user_admin', orgId: 'org_1', orgRole: 'org:admin' })
    mockStaffValue.mockStaffValue = false
    await expect(requireStaff()).rejects.toThrow(AuthError)
  })

  it('requireStaff throws for staff=false user (org:editor)', async () => {
    setMockSession({ userId: 'user_editor', orgId: 'org_1', orgRole: 'org:editor' })
    mockStaffValue.mockStaffValue = false
    await expect(requireStaff()).rejects.toThrow(AuthError)
  })

  it('requireStaff throws for staff=false user (org:marketing)', async () => {
    setMockSession({ userId: 'user_mkt', orgId: 'org_1', orgRole: 'org:marketing' })
    mockStaffValue.mockStaffValue = false
    await expect(requireStaff()).rejects.toThrow(AuthError)
  })

  it('requireStaff throws for staff=false user (org:viewer)', async () => {
    setMockSession({ userId: 'user_viewer', orgId: 'org_1', orgRole: 'org:viewer' })
    mockStaffValue.mockStaffValue = false
    await expect(requireStaff()).rejects.toThrow(AuthError)
  })

  it('requireStaff throws when user not found in DB', async () => {
    setMockSession({ userId: 'user_unknown', orgId: 'org_1', orgRole: 'org:owner' })
    mockStaffValue.mockStaffValue = null
    await expect(requireStaff()).rejects.toThrow(AuthError)
    await expect(requireStaff()).rejects.toThrow('Staff access required.')
  })

  it('requireStaff throws when unauthenticated', async () => {
    clearMockSession()
    await expect(requireStaff()).rejects.toThrow(AuthError)
    await expect(requireStaff()).rejects.toThrow('You must be signed in.')
  })

  it('vendor admin with staff=false must not pass staff check', async () => {
    setMockSession({ userId: 'user_admin', orgId: 'org_1', orgRole: 'org:admin' })
    mockStaffValue.mockStaffValue = false
    try {
      await requireStaff()
      expect(true).toBe(false) // should not reach here
    } catch (e) {
      expect(e).toBeInstanceOf(AuthError)
      expect((e as AuthError).code).toBe('not_staff')
    }
  })

  it('vendor owner with staff=false must not pass staff check', async () => {
    setMockSession({ userId: 'user_owner', orgId: 'org_1', orgRole: 'org:owner' })
    mockStaffValue.mockStaffValue = false
    try {
      await requireStaff()
      expect(true).toBe(false)
    } catch (e) {
      expect(e).toBeInstanceOf(AuthError)
      expect((e as AuthError).code).toBe('not_staff')
    }
  })
})

describe('Staff flag is orthogonal to org roles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearMockSession()
    mockStaffValue.mockStaffValue = null
  })

  const vendorRoles = ['org:owner', 'org:admin', 'org:editor', 'org:marketing', 'org:viewer'] as const

  for (const role of vendorRoles) {
    it(`${role} with staff=false is rejected by requireStaff`, async () => {
      setMockSession({ userId: `user_${role}`, orgId: 'org_1', orgRole: role })
      mockStaffValue.mockStaffValue = false
      await expect(requireStaff()).rejects.toThrow(AuthError)
    })
  }

  for (const role of vendorRoles) {
    it(`${role} with staff=true is accepted by requireStaff`, async () => {
      setMockSession({ userId: `user_${role}`, orgId: 'org_1', orgRole: role })
      mockStaffValue.mockStaffValue = true
      const ctx = await requireStaff()
      expect(ctx.orgRole).toBe(role)
    })
  }
})
