const GITHUB_API = 'https://api.github.com'

function headers(): HeadersInit {
  const h: HeadersInit = { Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return h
}

export async function fetchGitHubRepo(
  owner: string,
  repo: string,
  signal?: AbortSignal,
) {
  const [repoRes, releaseRes] = await Promise.all([
    fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: headers(),
      signal,
    }),
    fetch(`${GITHUB_API}/repos/${owner}/${repo}/releases/latest`, {
      headers: headers(),
      signal,
    }).catch(() => null),
  ])

  if (!repoRes.ok) {
    if (repoRes.status === 403 || repoRes.status === 429) {
      const reset = repoRes.headers.get('x-ratelimit-reset')
      const waitMs = reset
        ? Math.max(0, Number(reset) * 1000 - Date.now()) + 1000
        : 60_000
      throw new Error(`GitHub rate limited, retry after ${waitMs}ms`)
    }
    throw new Error(`GitHub API ${repoRes.status}: ${owner}/${repo}`)
  }

  const repoData = await repoRes.json()
  const releaseData = releaseRes?.ok ? await releaseRes.json() : null

  return {
    identifier: `${owner}/${repo}`,
    payload: {
      source: 'github',
      fullName: `${owner}/${repo}`,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      language: repoData.language,
      license: repoData.license?.spdx_id ?? null,
      description: repoData.description,
      homepage: repoData.homepage,
      defaultBranch: repoData.default_branch,
      createdAt: repoData.created_at,
      pushedAt: repoData.pushed_at,
      latestRelease: releaseData
        ? {
            tag: releaseData.tag_name,
            publishedAt: releaseData.published_at,
          }
        : null,
      fetchedAt: new Date().toISOString(),
    },
  }
}
