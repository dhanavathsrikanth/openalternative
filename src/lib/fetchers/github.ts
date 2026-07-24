const GITHUB_API = 'https://api.github.com'

function headers(): HeadersInit {
  const h: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  }
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return h
}

// ── GraphQL query — fetches everything in a single call ─────────────────────

const REPO_QUERY = `
query($owner: String!, $repo: String!) {
  repository(owner: $owner, name: $repo) {
    name
    nameWithOwner
    description
    homepageUrl
    url
    isArchived
    isFork
    defaultBranchRef { name }
    createdAt
    pushedAt
    updatedAt
    forkCount
    stargazerCount
    watcherCount
    issues(states: OPEN) { totalCount }
    licenseInfo { spdxId }
    primaryLanguage { name }
    repositoryTopics(first: 20) {
      nodes { topic { name } }
    }
    latestRelease {
      tagName
      publishedAt
    }
    diskUsage
  }
}
`

interface GraphQLRepoResponse {
  data: {
    repository: {
      name: string
      nameWithOwner: string
      description: string | null
      homepageUrl: string | null
      url: string
      isArchived: boolean
      isFork: boolean
      defaultBranchRef: { name: string } | null
      createdAt: string
      pushedAt: string
      updatedAt: string
      forkCount: number
      stargazerCount: number
      watcherCount: number
      issues: { totalCount: number }
      licenseInfo: { spdxId: string } | null
      primaryLanguage: { name: string } | null
      repositoryTopics: {
        nodes: { topic: { name: string } }[]
      }
      latestRelease: {
        tagName: string
        publishedAt: string
      } | null
      diskUsage: number
    } | null
  }
  errors?: { message: string }[]
}

export interface GitHubRepoPayload {
  source: 'github'
  fullName: string
  stars: number
  forks: number
  openIssues: number
  watchers: number
  language: string | null
  license: string | null
  description: string | null
  homepage: string | null
  defaultBranch: string
  createdAt: string
  pushedAt: string
  updatedAt: string
  archived: boolean
  fork: boolean
  topics: string[]
  size: number
  latestRelease: { tag: string; publishedAt: string } | null
  fetchedAt: string
}

export async function fetchGitHubRepo(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<{ identifier: string; payload: GitHubRepoPayload }> {
  const res = await fetch(GITHUB_API, {
    method: 'POST',
    headers: headers(),
    signal,
    body: JSON.stringify({
      query: REPO_QUERY,
      variables: { owner, repo },
    }),
  })

  if (!res.ok) {
    if (res.status === 403 || res.status === 429) {
      const reset = res.headers.get('x-ratelimit-reset')
      const waitMs = reset
        ? Math.max(0, Number(reset) * 1000 - Date.now()) + 1000
        : 60_000
      throw new Error(`GitHub rate limited, retry after ${waitMs}ms`)
    }
    throw new Error(`GitHub API ${res.status}: ${owner}/${repo}`)
  }

  const json = (await res.json()) as GraphQLRepoResponse

  if (json.errors?.length) {
    throw new Error(`GitHub GraphQL: ${json.errors[0].message} (${owner}/${repo})`)
  }

  const r = json.data.repository
  if (!r) {
    throw new Error(`GitHub repo not found: ${owner}/${repo}`)
  }

  return {
    identifier: `${owner}/${repo}`,
    payload: {
      source: 'github',
      fullName: r.nameWithOwner,
      stars: r.stargazerCount,
      forks: r.forkCount,
      openIssues: r.issues.totalCount,
      watchers: r.watcherCount,
      language: r.primaryLanguage?.name ?? null,
      license: r.licenseInfo?.spdxId ?? null,
      description: r.description,
      homepage: r.homepageUrl,
      defaultBranch: r.defaultBranchRef?.name ?? 'main',
      createdAt: r.createdAt,
      pushedAt: r.pushedAt,
      updatedAt: r.updatedAt,
      archived: r.isArchived,
      fork: r.isFork,
      topics: r.repositoryTopics.nodes.map((n) => n.topic.name),
      size: r.diskUsage,
      latestRelease: r.latestRelease
        ? {
            tag: r.latestRelease.tagName,
            publishedAt: r.latestRelease.publishedAt,
          }
        : null,
      fetchedAt: new Date().toISOString(),
    },
  }
}
