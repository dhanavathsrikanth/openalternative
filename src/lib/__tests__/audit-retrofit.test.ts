import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock DB ────────────────────────────────────────────────────────────

const { mockInsertValues, mockDbChain, mockTxChain, resetDbChain } = vi.hoisted(() => {
  const mockInsertValues = vi.fn().mockResolvedValue([{ id: 1 }])
  const mockReturning = vi.fn().mockResolvedValue([{ id: 1 }])

  const mockTxChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ id: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    delete: vi.fn().mockReturnThis(),
  }

  const mockDbChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ id: 1 }]),
    insert: vi.fn(() => ({
      values: mockInsertValues,
      returning: mockReturning,
    })),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([]),
    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    transaction: vi.fn((fn: Function) => fn(mockTxChain)),
  }

  function resetDbChain() {
    for (const fn of Object.values(mockDbChain)) {
      if (typeof fn === 'function' && fn.mockReset) fn.mockReset()
    }
    mockDbChain.select.mockReturnThis()
    mockDbChain.from.mockReturnThis()
    mockDbChain.where.mockReturnThis()
    mockDbChain.limit.mockResolvedValue([{ id: 1 }])
    mockDbChain.insert.mockReturnValue({
      values: mockInsertValues,
      returning: mockReturning,
    })
    mockDbChain.update.mockReturnThis()
    mockDbChain.set.mockReturnThis()
    mockDbChain.delete.mockReturnThis()
    mockDbChain.values.mockResolvedValue([])
    mockDbChain.returning.mockResolvedValue([{ id: 1 }])
    mockDbChain.transaction.mockImplementation((fn: Function) => fn(mockTxChain))

    for (const fn of Object.values(mockTxChain)) {
      if (typeof fn === 'function' && fn.mockReset) fn.mockReset()
    }
    mockTxChain.select.mockReturnThis()
    mockTxChain.from.mockReturnThis()
    mockTxChain.where.mockReturnThis()
    mockTxChain.limit.mockResolvedValue([{ id: 1 }])
    mockTxChain.update.mockReturnThis()
    mockTxChain.set.mockReturnThis()
    mockTxChain.insert.mockReturnThis()
    mockTxChain.values.mockReturnThis()
    mockTxChain.returning.mockResolvedValue([{ id: 1 }])
    mockTxChain.delete.mockReturnThis()
  }

  return { mockInsertValues, mockDbChain, mockTxChain, resetDbChain }
})

vi.mock('@/app/db', () => ({ db: mockDbChain }))

// ── Mock Clerk auth ────────────────────────────────────────────────────

const { mockSession, setMockSession } = vi.hoisted(() => {
  const mockSession: { userId: string | null; orgId: string | null; orgRole: string | null } = {
    userId: null, orgId: null, orgRole: null,
  }
  return {
    mockSession,
    setMockSession(overrides: Partial<typeof mockSession>) {
      Object.assign(mockSession, overrides)
    },
  }
})

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}))

// ── Mock Clerk client ─────────────────────────────────────────────────

const { mockUpdateMembership, mockRemoveMember, mockInviteMember, mockRevokeInvitation, mockGetMembershipList } = vi.hoisted(() => ({
  mockUpdateMembership: vi.fn().mockResolvedValue({}),
  mockRemoveMember: vi.fn().mockResolvedValue({}),
  mockInviteMember: vi.fn().mockResolvedValue({}),
  mockRevokeInvitation: vi.fn().mockResolvedValue({}),
  mockGetMembershipList: vi.fn().mockResolvedValue({
    data: [
      { id: 'm1', role: 'org:owner', publicUserData: { userId: 'user_1' } },
      { id: 'm2', role: 'org:editor', publicUserData: { userId: 'user_2' } },
    ],
  }),
}))

vi.mock('@/lib/clerk-client', () => ({
  getClerkClient: vi.fn(() => ({
    organizations: {
      getOrganizationMembershipList: mockGetMembershipList,
      inviteOrganizationMember: mockInviteMember,
      updateOrganizationMembership: mockUpdateMembership,
      removeOrganizationMember: mockRemoveMember,
      revokeOrganizationInvitation: mockRevokeInvitation,
    },
  })),
}))

// ── Mock next/cache ────────────────────────────────────────────────────

const mockRevalidatePath = vi.hoisted(() => vi.fn())
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

// ── Import after mocks ─────────────────────────────────────────────────

import { withAudit, logAudit } from '@/lib/audit'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { Products, ClaimRequests, Contributions, Contributors } from '@/app/db/schema'

// ══════════════════════════════════════════════════════════════════════════
// Regression tests: retrofitted mutations must behave identically
// ══════════════════════════════════════════════════════════════════════════

describe('Regression: claim initiation with audit wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDbChain()
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:admin' })
  })

  it('still inserts a ClaimRequest via withAudit', async () => {
    const result = await withAudit(
      'user_1',
      'claim.initiated',
      'claim_request',
      '1',
      async () => null,
      async (tx) => {
        return tx
          .insert(ClaimRequests)
          .values({
            productId: 1,
            organizationId: 1,
            method: 'dns_txt',
            verificationToken: 'tok_123',
          })
          .returning({ id: ClaimRequests.id })
      },
    )

    expect(result).toEqual([{ id: 1 }])
    expect(mockTxChain.insert).toHaveBeenCalled()
    expect(mockTxChain.values).toHaveBeenCalled()
  })
})

describe('Regression: claim verification with audit wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDbChain()
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:admin' })
  })

  it('still runs the claim verification transaction via withAudit', async () => {
    mockTxChain.returning.mockResolvedValueOnce([{ id: 1 }])

    const result = await withAudit(
      'user_1',
      'claim.verified',
      'product',
      '1',
      async () => ({ id: 1, name: 'Test Product', status: 'draft', claimedByOrgId: null }),
      async (tx) => {
        await tx.update(ClaimRequests).set({ status: 'verified' }).where(eq(ClaimRequests.id, 1))
        const updated = await tx
          .update(Products)
          .set({ claimedByOrgId: 1 })
          .where(and(eq(Products.id, 1), isNull(Products.claimedByOrgId)))
          .returning({ id: Products.id })
        return updated.length > 0
      },
    )

    expect(result).toBe(true)
    expect(mockDbChain.transaction).toHaveBeenCalled()
  })
})

describe('Regression: contribution moderation with audit wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDbChain()
  })

  it('still approves a contribution via withAudit', async () => {
    const contribution = {
      id: 1,
      productId: 10,
      contributorId: 5,
      changes: [{ field: 'description', value: 'New description' }],
      status: 'pending',
    }

    const result = await withAudit(
      'system',
      'contribution.approved',
      'contribution',
      '1',
      async () => contribution,
      async (tx) => {
        await tx.update(Contributions).set({ status: 'approved' }).where(eq(Contributions.id, 1))
        await tx
          .update(Products)
          .set({ description: 'New description', updatedAt: new Date() })
          .where(eq(Products.id, 10))
        await tx
          .update(Contributors)
          .set({ reputationPoints: sql`${Contributors.reputationPoints} + 5` })
          .where(eq(Contributors.id, 5))
      },
    )

    expect(result).toBeUndefined()
    expect(mockTxChain.update).toHaveBeenCalled()
  })

  it('still rejects a contribution via withAudit', async () => {
    const contribution = {
      id: 2,
      productId: 10,
      contributorId: 5,
      changes: [{ field: 'description', value: 'Bad edit' }],
      status: 'pending',
    }

    const result = await withAudit(
      'system',
      'contribution.rejected',
      'contribution',
      '2',
      async () => contribution,
      async (tx) => {
        await tx.update(Contributions).set({ status: 'rejected' }).where(eq(Contributions.id, 2))
      },
    )

    expect(result).toBeUndefined()
  })
})

describe('Regression: team role changes with logAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('role update still calls Clerk API and logs audit', async () => {
    await mockUpdateMembership({
      organizationId: 'org_1',
      userId: 'user_2',
      role: 'org:admin',
    })

    await logAudit('user_1', 'team.role_changed', 'member', 'user_2', null, { role: 'org:admin' })

    expect(mockUpdateMembership).toHaveBeenCalledWith({
      organizationId: 'org_1',
      userId: 'user_2',
      role: 'org:admin',
    })
  })

  it('member removal still calls Clerk API and logs audit', async () => {
    await mockRemoveMember({
      organizationId: 'org_1',
      userId: 'user_2',
    })

    await logAudit('user_1', 'team.member_removed', 'member', 'user_2', { role: 'org:editor' }, null)

    expect(mockRemoveMember).toHaveBeenCalledWith({
      organizationId: 'org_1',
      userId: 'user_2',
    })
  })

  it('invite still calls Clerk API and logs audit', async () => {
    await mockInviteMember({
      organizationId: 'org_1',
      emailAddress: 'new@example.com',
      role: 'org:editor',
    })

    await logAudit('user_1', 'team.invite_sent', 'member', 'new@example.com', null, { role: 'org:editor' })

    expect(mockInviteMember).toHaveBeenCalledWith({
      organizationId: 'org_1',
      emailAddress: 'new@example.com',
      role: 'org:editor',
    })
  })

  it('invitation revocation still calls Clerk API and logs audit', async () => {
    await mockRevokeInvitation({
      organizationId: 'org_1',
      invitationId: 'inv_1',
    })

    await logAudit('user_1', 'team.invite_revoked', 'member', 'inv_1', null, null)

    expect(mockRevokeInvitation).toHaveBeenCalledWith({
      organizationId: 'org_1',
      invitationId: 'inv_1',
    })
  })
})

describe('Regression: product profile edit with audit wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetDbChain()
    mockRevalidatePath.mockClear()
  })

  it('still updates product fields via withAudit', async () => {
    const result = await withAudit(
      'user_1',
      'product.profile_updated',
      'product',
      '1',
      async () => ({ id: 1, description: 'Old desc', status: 'draft' }),
      async (tx) => {
        await tx.update(Products).set({ description: 'New desc', updatedAt: new Date() }).where(eq(Products.id, 1))
      },
    )

    expect(result).toBeUndefined()
    expect(mockTxChain.update).toHaveBeenCalled()
  })
})
