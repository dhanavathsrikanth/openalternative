import { NextRequest, NextResponse } from 'next/server'
import { verifySecret, unauthorized, runBatch } from '@/lib/ingest'
import { fetchGitHubRepo } from '@/lib/fetchers/github'
import trackedRepos from '../../../../data/tracked-repos.json'

interface GitHubRepo {
  owner: string
  repo: string
  category: string
}

export async function GET(req: NextRequest) {
  if (!verifySecret(req)) return unauthorized()

  const repos = trackedRepos.github as GitHubRepo[]

  const result = await runBatch('github', repos, async (item) => {
    return fetchGitHubRepo(item.owner, item.repo)
  })

  return NextResponse.json({
    source: 'github',
    ...result,
  })
}
