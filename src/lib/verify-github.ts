/**
 * Extract the GitHub org name from a GitHub URL.
 *
 * Supports formats:
 *   https://github.com/orgname/repo
 *   https://github.com/orgname
 *
 * Returns null if the URL doesn't match.
 */
export function extractGithubOrg(githubUrl: string): string | null {
  try {
    const url = new URL(githubUrl)
    if (url.hostname !== 'github.com') return null
    const parts = url.pathname.split('/').filter(Boolean)
    return parts[0] ?? null
  } catch {
    return null
  }
}

interface MembershipCheckResult {
  isMember: boolean
  status: number
  error?: string
}

/**
 * Check whether a GitHub user is a public member of an organization.
 *
 * Uses the public membership endpoint:
 *   GET https://api.github.com/orgs/{org}/members/{username}
 *
 * Returns 204 if the user is a public member, 404 if not.
 */
export async function checkGithubOrgMembership(
  org: string,
  username: string,
  githubToken?: string,
): Promise<MembershipCheckResult> {
  const url = `https://api.github.com/orgs/${encodeURIComponent(org)}/members/${encodeURIComponent(username)}`

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`
  }

  try {
    const res = await fetch(url, { headers })
    return {
      isMember: res.status === 204,
      status: res.status,
    }
  } catch (err) {
    return {
      isMember: false,
      status: 0,
      error: err instanceof Error ? err.message : 'unknown fetch error',
    }
  }
}

/**
 * Full GitHub org membership verification flow: extract org from URL,
 * check membership against the GitHub API.
 */
export async function verifyGithubMembership(
  githubUrl: string,
  username: string,
  githubToken?: string,
): Promise<{ verified: boolean; org: string; status: number; error?: string }> {
  const org = extractGithubOrg(githubUrl)
  if (!org) {
    return { verified: false, org: '', status: 0, error: 'Invalid GitHub URL' }
  }

  const result = await checkGithubOrgMembership(org, username, githubToken)
  return {
    verified: result.isMember,
    org,
    status: result.status,
    error: result.error,
  }
}
