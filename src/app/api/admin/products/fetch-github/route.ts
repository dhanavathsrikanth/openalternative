import { NextRequest, NextResponse } from 'next/server'
import { requireStaff } from '@/lib/auth'
import { fetchGitHubRepo } from '@/lib/fetchers/github'

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) return null
  return { owner: match[1], repo: match[2].replace(/\.git$/, '').replace(/\/$/, '') }
}

export async function POST(req: NextRequest) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const url = (body.url as string)?.trim()

  if (!url) {
    return NextResponse.json({ error: 'GitHub URL is required' }, { status: 400 })
  }

  const parsed = parseGithubUrl(url)
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid GitHub URL format' }, { status: 400 })
  }

  try {
    const { payload } = await fetchGitHubRepo(parsed.owner, parsed.repo)

    return NextResponse.json({
      name: payload.fullName.split('/')[1],
      description: payload.description ?? '',
      homepage: payload.homepage ?? '',
      license: payload.license ?? '',
      language: payload.language ?? '',
      stars: payload.stars,
      forks: payload.forks,
      openIssues: payload.openIssues,
      watchers: payload.watchers,
      topics: payload.topics,
      repoSize: payload.size,
      defaultBranch: payload.defaultBranch,
      archived: payload.archived,
      fork: payload.fork,
      pushedAt: payload.pushedAt,
      latestRelease: payload.latestRelease,
      contributorsCount: payload.contributorsCount,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('not found')) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
    }
    if (msg.includes('rate limited')) {
      return NextResponse.json({ error: 'GitHub API rate limited. Try again later.' }, { status: 429 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
