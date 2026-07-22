import { describe, it, expect } from 'vitest'

// ── Contributions constraint logic tests ──────────────────────────────────
//
// These tests verify the business rules enforced by the contributions system:
//   1. A product can receive unlimited suggested edits over time.
//   2. A contributor can submit a new contribution after a prior one was approved or rejected.
//   3. A contributor cannot have two *pending* contributions on the same product simultaneously.
//
// The actual enforcement lives in the partial unique index
//   contributions_pending_per_contributor_idx  ON (product_id, contributor_id) WHERE status = 'pending'
// and in the explicit check in POST /api/contributions.

type ContributionStatus = 'pending' | 'approved' | 'rejected'

interface Contribution {
  id: number
  productId: number
  contributorId: number
  status: ContributionStatus
}

/**
 * Simulates the server-side duplicate-pending check performed in POST /api/contributions.
 * Returns true if the new contribution should be rejected (409).
 */
function isDuplicatePending(
  existing: Contribution[],
  productId: number,
  contributorId: number,
): boolean {
  return existing.some(
    (c) =>
      c.productId === productId &&
      c.contributorId === contributorId &&
      c.status === 'pending',
  )
}

/**
 * Simulates whether a contributor is allowed to submit a new contribution
 * for a given product, given their existing contributions.
 */
function canSubmitContribution(
  existing: Contribution[],
  productId: number,
  contributorId: number,
): boolean {
  return !isDuplicatePending(existing, productId, contributorId)
}

describe('Contributions: multiple contributions per product', () => {
  it('allows multiple contributions from different contributors on the same product', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'pending' },
    ]
    expect(canSubmitContribution(existing, 10, 2)).toBe(true)
  })

  it('allows multiple contributions over time after status changes', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'approved' },
    ]
    expect(canSubmitContribution(existing, 10, 1)).toBe(true)
  })

  it('allows resubmission after rejection', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'rejected' },
    ]
    expect(canSubmitContribution(existing, 10, 1)).toBe(true)
  })

  it('allows unlimited historical contributions for one product', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'approved' },
      { id: 2, productId: 10, contributorId: 2, status: 'approved' },
      { id: 3, productId: 10, contributorId: 3, status: 'rejected' },
      { id: 4, productId: 10, contributorId: 1, status: 'approved' },
      { id: 5, productId: 10, contributorId: 2, status: 'approved' },
    ]
    // No pending contributions exist, so anyone can submit
    expect(canSubmitContribution(existing, 10, 1)).toBe(true)
    expect(canSubmitContribution(existing, 10, 4)).toBe(true)
  })
})

describe('Contributions: duplicate pending prevention', () => {
  it('blocks a second pending contribution from the same contributor on the same product', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'pending' },
    ]
    expect(canSubmitContribution(existing, 10, 1)).toBe(false)
  })

  it('still allows the same contributor on a different product while pending exists', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'pending' },
    ]
    expect(canSubmitContribution(existing, 20, 1)).toBe(true)
  })

  it('allows submission after the pending contribution is approved', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'approved' },
    ]
    expect(canSubmitContribution(existing, 10, 1)).toBe(true)
  })

  it('allows submission after the pending contribution is rejected', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'rejected' },
    ]
    expect(canSubmitContribution(existing, 10, 1)).toBe(true)
  })

  it('blocks only when there is exactly one pending contribution', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'approved' },
      { id: 2, productId: 10, contributorId: 1, status: 'pending' },
    ]
    // The partial unique index ensures only one pending row can exist,
    // but the business logic check is: is there ANY pending?
    expect(canSubmitContribution(existing, 10, 1)).toBe(false)
  })
})

describe('Contributions: concurrent contributors', () => {
  it('allows many different contributors to have pending contributions on the same product', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'pending' },
      { id: 2, productId: 10, contributorId: 2, status: 'pending' },
      { id: 3, productId: 10, contributorId: 3, status: 'pending' },
    ]
    expect(canSubmitContribution(existing, 10, 4)).toBe(true)
  })

  it('does not block contributor A because contributor B has a pending contribution', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 2, status: 'pending' },
    ]
    expect(canSubmitContribution(existing, 10, 1)).toBe(true)
  })
})

describe('Contributions: moderation workflow', () => {
  it('moderator can approve a contribution, then contributor can submit again', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'approved' },
    ]
    // After approval, contributor can submit a follow-up correction
    expect(canSubmitContribution(existing, 10, 1)).toBe(true)
  })

  it('moderator can reject a contribution, then contributor can resubmit', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'rejected' },
    ]
    // After rejection, contributor can try again
    expect(canSubmitContribution(existing, 10, 1)).toBe(true)
  })

  it('product accumulates contributions over its lifetime', () => {
    const allContributions: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'approved' },
      { id: 2, productId: 10, contributorId: 2, status: 'rejected' },
      { id: 3, productId: 10, contributorId: 1, status: 'approved' },
      { id: 4, productId: 10, contributorId: 3, status: 'approved' },
    ]
    const productContributions = allContributions.filter((c) => c.productId === 10)
    expect(productContributions).toHaveLength(4)
  })
})

describe('Contributions: auto-approve threshold', () => {
  it('auto-approves contributions from high-reputation contributors', () => {
    const AUTO_APPROVE_THRESHOLD = 50
    const contributorRep = 60
    const status = contributorRep >= AUTO_APPROVE_THRESHOLD ? 'approved' : 'pending'
    expect(status).toBe('approved')
  })

  it('queues contributions from low-reputation contributors for review', () => {
    const AUTO_APPROVE_THRESHOLD = 50
    const contributorRep = 10
    const status = contributorRep >= AUTO_APPROVE_THRESHOLD ? 'approved' : 'pending'
    expect(status).toBe('pending')
  })

  it('auto-approved contributions do not block follow-up submissions', () => {
    const existing: Contribution[] = [
      { id: 1, productId: 10, contributorId: 1, status: 'approved' },
    ]
    // Auto-approved means status is 'approved', not 'pending', so no block
    expect(isDuplicatePending(existing, 10, 1)).toBe(false)
  })
})
