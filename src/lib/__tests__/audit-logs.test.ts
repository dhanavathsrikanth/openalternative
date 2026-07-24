import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock DB ────────────────────────────────────────────────────────────

const { mockInsertValues, mockDbChain } = vi.hoisted(() => {
  const mockInsertValues = vi.fn().mockResolvedValue([])

  const mockTxChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ id: 1 }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 1 }]),
  }

  const mockDbChain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([{ id: 1, name: 'test', status: 'draft' }]),
    insert: vi.fn(() => ({
      values: mockInsertValues,
    })),
    transaction: vi.fn((fn: Function) => fn(mockTxChain)),
  }

  return { mockInsertValues, mockDbChain }
})

vi.mock('@/app/db', () => ({ db: mockDbChain }))

// ── Import after mocks ─────────────────────────────────────────────────

import { withAudit, logAudit } from '@/lib/audit'

describe('withAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDbChain.transaction.mockImplementation((fn: Function) => fn({
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: 1 }]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 1 }]),
    }))
  })

  it('calls fn inside a transaction', async () => {
    const fn = vi.fn().mockResolvedValue('result')
    const getBefore = vi.fn().mockResolvedValue({ id: 1, status: 'draft' })

    const result = await withAudit('user_1', 'product.updated', 'product', '1', getBefore, fn)

    expect(result).toBe('result')
    expect(fn).toHaveBeenCalled()
    expect(mockDbChain.transaction).toHaveBeenCalled()
  })

  it('inserts audit log row with before/after snapshots', async () => {
    const fn = vi.fn().mockResolvedValue(undefined)
    const getBefore = vi.fn()
      .mockResolvedValueOnce({ id: 1, status: 'draft' })  // before
      .mockResolvedValueOnce({ id: 1, status: 'published' }) // after

    await withAudit('user_1', 'product.published', 'product', '1', getBefore, fn)

    expect(mockInsertValues).toHaveBeenCalledWith({
      actorId: 'user_1',
      action: 'product.published',
      entityType: 'product',
      entityId: '1',
      before: { id: 1, status: 'draft' },
      after: { id: 1, status: 'published' },
    })
  })

  it('records null before snapshot when getBefore returns null', async () => {
    const fn = vi.fn().mockResolvedValue(undefined)
    const getBefore = vi.fn().mockResolvedValue(null)

    await withAudit('user_1', 'claim.initiated', 'claim_request', '42', getBefore, fn)

    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user_1',
        action: 'claim.initiated',
        before: null,
      }),
    )
  })

  it('rolls back when fn throws', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'))
    const getBefore = vi.fn().mockResolvedValue(null)

    await expect(
      withAudit('user_1', 'test.action', 'entity', '1', getBefore, fn),
    ).rejects.toThrow('boom')

    // Audit log should NOT be written on failure
    expect(mockInsertValues).not.toHaveBeenCalled()
  })

  it('passes the transaction object to fn', async () => {
    const fn = vi.fn().mockResolvedValue(undefined)
    const getBefore = vi.fn().mockResolvedValue(null)

    await withAudit('user_1', 'test.action', 'entity', '1', getBefore, fn)

    const passedTx = fn.mock.calls[0][0]
    expect(passedTx).toBeDefined()
    expect(typeof passedTx.update).toBe('function')
  })
})

describe('logAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inserts an audit log row with all fields', async () => {
    await logAudit('user_1', 'team.role_changed', 'member', 'm1', null, { role: 'org:admin' })

    expect(mockInsertValues).toHaveBeenCalledWith({
      actorId: 'user_1',
      action: 'team.role_changed',
      entityType: 'member',
      entityId: 'm1',
      before: null,
      after: { role: 'org:admin' },
    })
  })

  it('inserts an audit log row with before and after', async () => {
    await logAudit(
      'user_1',
      'contribution.approved',
      'contribution',
      '5',
      { status: 'pending', changes: { field: 'description' } },
      { status: 'approved' },
    )

    expect(mockInsertValues).toHaveBeenCalledWith({
      actorId: 'user_1',
      action: 'contribution.approved',
      entityType: 'contribution',
      entityId: '5',
      before: { status: 'pending', changes: { field: 'description' } },
      after: { status: 'approved' },
    })
  })

  it('defaults before/after to null', async () => {
    await logAudit('system', 'product.published', 'product', 'slug-1')

    expect(mockInsertValues).toHaveBeenCalledWith({
      actorId: 'system',
      action: 'product.published',
      entityType: 'product',
      entityId: 'slug-1',
      before: null,
      after: null,
    })
  })
})
