import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock @clerk/nextjs/server ────────────────────────────────────────────

let mockSession: { userId: string | null; orgId: string | null; orgRole: string | null } = {
  userId: null,
  orgId: null,
  orgRole: null,
}

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}))

// ── Mock @/app/db (auth.ts now imports db + Users) ──────────────────────

vi.mock('@/app/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ staff: false }]),
  },
}))

// ── Mock @/app/db/schema ────────────────────────────────────────────────

vi.mock('@/app/db/schema', () => ({
  Users: { staff: 'staff' },
}))

import {
  hasRole,
  hasPermission,
  requireOrgRole,
  requirePermission,
  requireSession,
  AuthError,
  ROLE_HIERARCHY,
  type OrgRole,
  type SessionContext,
} from '@/lib/auth'

function setMockSession(overrides: Partial<typeof mockSession>) {
  mockSession = { ...mockSession, ...overrides }
}

function clearMockSession() {
  mockSession = { userId: null, orgId: null, orgRole: null }
}

// ── Pure helper tests (no mocking needed) ────────────────────────────────

describe('ROLE_HIERARCHY', () => {
  it('orders roles correctly: owner > admin > editor > marketing > viewer', () => {
    expect(ROLE_HIERARCHY['org:owner']).toBeGreaterThan(ROLE_HIERARCHY['org:admin'])
    expect(ROLE_HIERARCHY['org:admin']).toBeGreaterThan(ROLE_HIERARCHY['org:editor'])
    expect(ROLE_HIERARCHY['org:editor']).toBeGreaterThan(ROLE_HIERARCHY['org:marketing'])
    expect(ROLE_HIERARCHY['org:marketing']).toBeGreaterThan(ROLE_HIERARCHY['org:viewer'])
  })
})

describe('hasRole', () => {
  it('returns true when current role meets minimum', () => {
    expect(hasRole('org:owner', 'org:admin')).toBe(true)
    expect(hasRole('org:admin', 'org:editor')).toBe(true)
    expect(hasRole('org:editor', 'org:marketing')).toBe(true)
    expect(hasRole('org:marketing', 'org:viewer')).toBe(true)
    expect(hasRole('org:viewer', 'org:viewer')).toBe(true)
  })

  it('returns false when current role is below minimum', () => {
    expect(hasRole('org:viewer', 'org:marketing')).toBe(false)
    expect(hasRole('org:marketing', 'org:editor')).toBe(false)
    expect(hasRole('org:editor', 'org:admin')).toBe(false)
    expect(hasRole('org:admin', 'org:owner')).toBe(false)
  })

  it('returns true when role exactly matches', () => {
    for (const role of Object.keys(ROLE_HIERARCHY) as OrgRole[]) {
      expect(hasRole(role, role)).toBe(true)
    }
  })
})

describe('hasPermission', () => {
  it('owner has all permissions', () => {
    const permissions: Parameters<typeof hasPermission>[1][] = [
      'org:manage_settings',
      'org:manage_members',
      'org:create_content',
      'org:edit_content',
      'org:delete_content',
      'org:publish_content',
      'org:review_contributions',
      'org:manage_newsletter',
      'org:run_cron',
    ]
    for (const perm of permissions) {
      expect(hasPermission('org:owner', perm)).toBe(true)
    }
  })

  it('viewer has no permissions', () => {
    const permissions: Parameters<typeof hasPermission>[1][] = [
      'org:manage_settings',
      'org:manage_members',
      'org:create_content',
      'org:edit_content',
      'org:delete_content',
      'org:publish_content',
      'org:review_contributions',
      'org:manage_newsletter',
      'org:run_cron',
    ]
    for (const perm of permissions) {
      expect(hasPermission('org:viewer', perm)).toBe(false)
    }
  })

  it('admin has manage_members but not manage_settings', () => {
    expect(hasPermission('org:admin', 'org:manage_members')).toBe(true)
    expect(hasPermission('org:admin', 'org:manage_settings')).toBe(false)
  })

  it('editor can create/edit/delete/publish content and review contributions', () => {
    expect(hasPermission('org:editor', 'org:create_content')).toBe(true)
    expect(hasPermission('org:editor', 'org:edit_content')).toBe(true)
    expect(hasPermission('org:editor', 'org:delete_content')).toBe(true)
    expect(hasPermission('org:editor', 'org:publish_content')).toBe(true)
    expect(hasPermission('org:editor', 'org:review_contributions')).toBe(true)
    expect(hasPermission('org:editor', 'org:manage_newsletter')).toBe(false)
    expect(hasPermission('org:editor', 'org:run_cron')).toBe(false)
    expect(hasPermission('org:editor', 'org:manage_members')).toBe(false)
  })

  it('marketing can create/edit content and manage newsletter but not delete or publish', () => {
    expect(hasPermission('org:marketing', 'org:create_content')).toBe(true)
    expect(hasPermission('org:marketing', 'org:edit_content')).toBe(true)
    expect(hasPermission('org:marketing', 'org:manage_newsletter')).toBe(true)
    expect(hasPermission('org:marketing', 'org:delete_content')).toBe(false)
    expect(hasPermission('org:marketing', 'org:publish_content')).toBe(false)
    expect(hasPermission('org:marketing', 'org:review_contributions')).toBe(false)
  })
})

// ── Async auth helper tests (with mocked session) ────────────────────────

describe('requireSession', () => {
  beforeEach(() => clearMockSession())

  it('returns session context when authenticated with org', async () => {
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:editor' })
    const ctx = await requireSession()
    expect(ctx).toEqual({
      userId: 'user_1',
      orgId: 'org_1',
      orgRole: 'org:editor',
    })
  })

  it('throws AuthError when unauthenticated', async () => {
    clearMockSession()
    await expect(requireSession()).rejects.toThrow(AuthError)
    await expect(requireSession()).rejects.toThrow('You must be signed in.')
  })

  it('throws AuthError when no organization', async () => {
    setMockSession({ userId: 'user_1', orgId: null, orgRole: null })
    await expect(requireSession()).rejects.toThrow(AuthError)
    await expect(requireSession()).rejects.toThrow('You must belong to an organization.')
  })
})

describe('requireOrgRole', () => {
  beforeEach(() => clearMockSession())

  it('allows when role meets minimum', async () => {
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:admin' })
    const ctx = await requireOrgRole('org:editor')
    expect(ctx.orgRole).toBe('org:admin')
  })

  it('allows when role exactly matches', async () => {
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:editor' })
    const ctx = await requireOrgRole('org:editor')
    expect(ctx.orgRole).toBe('org:editor')
  })

  it('rejects when role is below minimum', async () => {
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:viewer' })
    await expect(requireOrgRole('org:editor')).rejects.toThrow(AuthError)
    await expect(requireOrgRole('org:editor')).rejects.toThrow('does not meet the minimum required role')
  })

  it('defaults to viewer when orgRole is null', async () => {
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: null })
    await expect(requireOrgRole('org:viewer')).resolves.toBeDefined()
    await expect(requireOrgRole('org:editor')).rejects.toThrow(AuthError)
  })
})

describe('requirePermission', () => {
  beforeEach(() => clearMockSession())

  it('allows when role has the permission', async () => {
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:editor' })
    const ctx = await requirePermission('org:create_content')
    expect(ctx.orgRole).toBe('org:editor')
  })

  it('rejects when role lacks the permission', async () => {
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:viewer' })
    await expect(requirePermission('org:create_content')).rejects.toThrow(AuthError)
    await expect(requirePermission('org:create_content')).rejects.toThrow('does not have the "org:create_content" permission')
  })
})

// ── Full permission matrix integration tests ─────────────────────────────

describe('Permission matrix: forbidden mutations by role', () => {
  beforeEach(() => clearMockSession())

  const forbiddenCases: Array<{
    role: OrgRole
    permission: string
    description: string
  }> = [
    // Viewer cannot do anything
    { role: 'org:viewer', permission: 'org:create_content', description: 'Viewer cannot create content' },
    { role: 'org:viewer', permission: 'org:edit_content', description: 'Viewer cannot edit content' },
    { role: 'org:viewer', permission: 'org:delete_content', description: 'Viewer cannot delete content' },
    { role: 'org:viewer', permission: 'org:publish_content', description: 'Viewer cannot publish content' },
    { role: 'org:viewer', permission: 'org:review_contributions', description: 'Viewer cannot review contributions' },
    { role: 'org:viewer', permission: 'org:manage_members', description: 'Viewer cannot manage members' },
    { role: 'org:viewer', permission: 'org:manage_settings', description: 'Viewer cannot manage settings' },
    { role: 'org:viewer', permission: 'org:manage_newsletter', description: 'Viewer cannot manage newsletter' },
    { role: 'org:viewer', permission: 'org:run_cron', description: 'Viewer cannot run cron' },

    // Marketing cannot delete, publish, review, manage members/settings/cron
    { role: 'org:marketing', permission: 'org:delete_content', description: 'Marketing cannot delete content' },
    { role: 'org:marketing', permission: 'org:publish_content', description: 'Marketing cannot publish content' },
    { role: 'org:marketing', permission: 'org:review_contributions', description: 'Marketing cannot review contributions' },
    { role: 'org:marketing', permission: 'org:manage_members', description: 'Marketing cannot manage members' },
    { role: 'org:marketing', permission: 'org:manage_settings', description: 'Marketing cannot manage settings' },
    { role: 'org:marketing', permission: 'org:run_cron', description: 'Marketing cannot run cron' },

    // Editor cannot manage members, settings, newsletter, cron
    { role: 'org:editor', permission: 'org:manage_members', description: 'Editor cannot manage members' },
    { role: 'org:editor', permission: 'org:manage_settings', description: 'Editor cannot manage settings' },
    { role: 'org:editor', permission: 'org:manage_newsletter', description: 'Editor cannot manage newsletter' },
    { role: 'org:editor', permission: 'org:run_cron', description: 'Editor cannot run cron' },

    // Admin cannot manage settings
    { role: 'org:admin', permission: 'org:manage_settings', description: 'Admin cannot manage settings' },
  ]

  for (const { role, permission, description } of forbiddenCases) {
    it(description, async () => {
      setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: role })
      await expect(requirePermission(permission as any)).rejects.toThrow(AuthError)
    })
  }
})

describe('Permission matrix: allowed mutations by role', () => {
  beforeEach(() => clearMockSession())

  const allowedCases: Array<{
    role: OrgRole
    permission: string
    description: string
  }> = [
    // Owner can do everything
    { role: 'org:owner', permission: 'org:manage_settings', description: 'Owner can manage settings' },
    { role: 'org:owner', permission: 'org:manage_members', description: 'Owner can manage members' },
    { role: 'org:owner', permission: 'org:create_content', description: 'Owner can create content' },
    { role: 'org:owner', permission: 'org:edit_content', description: 'Owner can edit content' },
    { role: 'org:owner', permission: 'org:delete_content', description: 'Owner can delete content' },
    { role: 'org:owner', permission: 'org:publish_content', description: 'Owner can publish content' },
    { role: 'org:owner', permission: 'org:review_contributions', description: 'Owner can review contributions' },
    { role: 'org:owner', permission: 'org:manage_newsletter', description: 'Owner can manage newsletter' },
    { role: 'org:owner', permission: 'org:run_cron', description: 'Owner can run cron' },

    // Admin can do everything except settings
    { role: 'org:admin', permission: 'org:manage_members', description: 'Admin can manage members' },
    { role: 'org:admin', permission: 'org:create_content', description: 'Admin can create content' },
    { role: 'org:admin', permission: 'org:edit_content', description: 'Admin can edit content' },
    { role: 'org:admin', permission: 'org:delete_content', description: 'Admin can delete content' },
    { role: 'org:admin', permission: 'org:publish_content', description: 'Admin can publish content' },
    { role: 'org:admin', permission: 'org:review_contributions', description: 'Admin can review contributions' },
    { role: 'org:admin', permission: 'org:manage_newsletter', description: 'Admin can manage newsletter' },
    { role: 'org:admin', permission: 'org:run_cron', description: 'Admin can run cron' },

    // Editor can create, edit, delete, publish content and review contributions
    { role: 'org:editor', permission: 'org:create_content', description: 'Editor can create content' },
    { role: 'org:editor', permission: 'org:edit_content', description: 'Editor can edit content' },
    { role: 'org:editor', permission: 'org:delete_content', description: 'Editor can delete content' },
    { role: 'org:editor', permission: 'org:publish_content', description: 'Editor can publish content' },
    { role: 'org:editor', permission: 'org:review_contributions', description: 'Editor can review contributions' },

    // Marketing can create, edit content and manage newsletter
    { role: 'org:marketing', permission: 'org:create_content', description: 'Marketing can create content' },
    { role: 'org:marketing', permission: 'org:edit_content', description: 'Marketing can edit content' },
    { role: 'org:marketing', permission: 'org:manage_newsletter', description: 'Marketing can manage newsletter' },
  ]

  for (const { role, permission, description } of allowedCases) {
    it(description, async () => {
      setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: role })
      const ctx = await requirePermission(permission as any)
      expect(ctx.orgRole).toBe(role)
    })
  }
})

describe('Permission matrix: role escalation guard', () => {
  beforeEach(() => clearMockSession())

  it('viewer cannot escalate to editor via requireOrgRole', async () => {
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:viewer' })
    await expect(requireOrgRole('org:editor')).rejects.toThrow(AuthError)
  })

  it('marketing cannot escalate to admin via requireOrgRole', async () => {
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:marketing' })
    await expect(requireOrgRole('org:admin')).rejects.toThrow(AuthError)
  })

  it('editor cannot escalate to owner via requireOrgRole', async () => {
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:editor' })
    await expect(requireOrgRole('org:owner')).rejects.toThrow(AuthError)
  })

  it('admin cannot escalate to owner via requireOrgRole', async () => {
    setMockSession({ userId: 'user_1', orgId: 'org_1', orgRole: 'org:admin' })
    await expect(requireOrgRole('org:owner')).rejects.toThrow(AuthError)
  })
})
