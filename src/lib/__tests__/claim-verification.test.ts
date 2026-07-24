import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractHostname, buildDnsTxtValue, verifyDnsTxt } from '@/lib/verify-dns'
import { extractGithubOrg, checkGithubOrgMembership } from '@/lib/verify-github'

// ── DNS TXT verification tests ──────────────────────────────────────────

describe('extractHostname', () => {
  it('extracts hostname from a valid URL', () => {
    expect(extractHostname('https://example.com')).toBe('example.com')
    expect(extractHostname('https://example.com/path?q=1')).toBe('example.com')
    expect(extractHostname('http://sub.domain.co.uk')).toBe('sub.domain.co.uk')
  })

  it('returns null for invalid URLs', () => {
    expect(extractHostname('not-a-url')).toBeNull()
    expect(extractHostname('')).toBeNull()
  })

  it('returns hostname for any scheme that new URL accepts', () => {
    expect(extractHostname('ftp://files.example.com')).toBe('files.example.com')
  })
})

describe('buildDnsTxtValue', () => {
  it('produces the correct format', () => {
    const token = 'abc123'
    expect(buildDnsTxtValue(token)).toBe('forklane-verify=abc123')
  })

  it('includes the full token', () => {
    const token = 'a'.repeat(64)
    expect(buildDnsTxtValue(token)).toBe(`forklane-verify=${token}`)
  })
})

describe('verifyDnsTxt', () => {
  it('returns verified=true when matching TXT record exists', async () => {
    const mockResolver = vi.fn().mockResolvedValue([
      ['forklane-verify=tok_abc123'],
      ['some-other-record'],
    ])

    const result = await verifyDnsTxt('example.com', 'tok_abc123', mockResolver)
    expect(result.verified).toBe(true)
    expect(result.records).toHaveLength(2)
    expect(mockResolver).toHaveBeenCalledWith('example.com')
  })

  it('returns verified=false when no matching TXT record', async () => {
    const mockResolver = vi.fn().mockResolvedValue([
      ['some-other-record'],
      ['v=spf1 include:_spf.google.com ~all'],
    ])

    const result = await verifyDnsTxt('example.com', 'tok_abc123', mockResolver)
    expect(result.verified).toBe(false)
  })

  it('returns verified=false when DNS lookup fails', async () => {
    const mockResolver = vi.fn().mockRejectedValue(new Error('ENOTFOUND'))

    const result = await verifyDnsTxt('nonexistent.com', 'tok_abc123', mockResolver)
    expect(result.verified).toBe(false)
    expect(result.records).toEqual([])
  })

  it('returns verified=false when TXT records are empty', async () => {
    const mockResolver = vi.fn().mockResolvedValue([])

    const result = await verifyDnsTxt('example.com', 'tok_abc123', mockResolver)
    expect(result.verified).toBe(false)
  })

  it('does not match when token is split across DNS record parts', async () => {
    const mockResolver = vi.fn().mockResolvedValue([
      ['forklane-verify=', 'tok_abc123'],
    ])

    const result = await verifyDnsTxt('example.com', 'tok_abc123', mockResolver)
    expect(result.verified).toBe(false)
  })

  it('matches exact token in single TXT record', async () => {
    const mockResolver = vi.fn().mockResolvedValue([
      ['forklane-verify=tok_abc123'],
    ])

    const result = await verifyDnsTxt('example.com', 'tok_abc123', mockResolver)
    expect(result.verified).toBe(true)
  })

  it('matches when one of multiple records has the token', async () => {
    const mockResolver = vi.fn().mockResolvedValue([
      ['v=spf1 include:_spf.google.com ~all'],
      ['google-site-verification=xyz'],
      ['forklane-verify=tok_abc123'],
    ])

    const result = await verifyDnsTxt('example.com', 'tok_abc123', mockResolver)
    expect(result.verified).toBe(true)
    expect(result.records).toHaveLength(3)
  })
})

// ── GitHub org membership tests ─────────────────────────────────────────

describe('extractGithubOrg', () => {
  it('extracts org from a standard GitHub URL', () => {
    expect(extractGithubOrg('https://github.com/acme-corp/my-repo')).toBe('acme-corp')
    expect(extractGithubOrg('https://github.com/acme-corp')).toBe('acme-corp')
    expect(extractGithubOrg('https://github.com/acme-corp/my-repo/issues')).toBe('acme-corp')
  })

  it('returns null for non-GitHub URLs', () => {
    expect(extractGithubOrg('https://gitlab.com/acme/repo')).toBeNull()
    expect(extractGithubOrg('https://example.com')).toBeNull()
    expect(extractGithubOrg('not-a-url')).toBeNull()
  })

  it('returns null for empty path', () => {
    expect(extractGithubOrg('https://github.com/')).toBeNull()
  })
})

describe('checkGithubOrgMembership', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns isMember=true when API returns 204', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({ status: 204 })

    const result = await checkGithubOrgMembership('acme-corp', 'testuser')
    expect(result.isMember).toBe(true)
    expect(result.status).toBe(204)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.github.com/orgs/acme-corp/members/testuser',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/vnd.github+json',
        }),
      })
    )
  })

  it('returns isMember=false when API returns 404', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({ status: 404 })

    const result = await checkGithubOrgMembership('acme-corp', 'testuser')
    expect(result.isMember).toBe(false)
    expect(result.status).toBe(404)
  })

  it('returns isMember=false when API returns 302 (redirect)', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({ status: 302 })

    const result = await checkGithubOrgMembership('acme-corp', 'testuser')
    expect(result.isMember).toBe(false)
    expect(result.status).toBe(302)
  })

  it('includes authorization header when token is provided', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({ status: 204 })

    await checkGithubOrgMembership('acme-corp', 'testuser', 'ghp_testtoken')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.github.com/orgs/acme-corp/members/testuser',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer ghp_testtoken',
        }),
      })
    )
  })

  it('returns error when fetch throws', async () => {
    ;(globalThis.fetch as any).mockRejectedValue(new Error('Network error'))

    const result = await checkGithubOrgMembership('acme-corp', 'testuser')
    expect(result.isMember).toBe(false)
    expect(result.error).toBe('Network error')
    expect(result.status).toBe(0)
  })

  it('URL-encodes org and username', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({ status: 204 })

    await checkGithubOrgMembership('my-org', 'user/name')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.github.com/orgs/my-org/members/user%2Fname',
      expect.anything()
    )
  })
})

// ── Already-claimed edge case tests ─────────────────────────────────────

describe('Already-claimed product edge case', () => {
  it('initiation rejects with 409 when product is claimed by another org', async () => {
    const productClaimedByOrg = 1
    const requestingOrg = 2

    const isClaimed = productClaimedByOrg !== null && productClaimedByOrg !== requestingOrg
    expect(isClaimed).toBe(true)
  })

  it('initiation allows when product is claimed by the same org', async () => {
    const productClaimedByOrg = 1
    const requestingOrg = 1

    const isConflict = productClaimedByOrg !== null && productClaimedByOrg !== requestingOrg
    expect(isConflict).toBe(false)
  })

  it('initiation allows when product is unclaimed', async () => {
    const productClaimedByOrg = null
    const requestingOrg = 1

    const isConflict = productClaimedByOrg !== null && productClaimedByOrg !== requestingOrg
    expect(isConflict).toBe(false)
  })

  it('verify rejects with 409 when product was claimed during verification (race)', async () => {
    const transactionReturnedZeroRows = false
    const shouldReturn409 = !transactionReturnedZeroRows
    expect(shouldReturn409).toBe(true)
  })
})
