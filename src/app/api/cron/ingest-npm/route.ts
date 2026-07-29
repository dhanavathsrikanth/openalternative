import { NextRequest, NextResponse } from 'next/server'
import { verifySecret, unauthorized, runBatch } from '@/lib/ingest'
import { fetchNpmPackage } from '@/lib/fetchers/npm'
import trackedRepos from '../../../../../data/tracked-repos.json'

interface NpmPackage {
  name: string
  category: string
}

export async function GET(req: NextRequest) {
  if (!verifySecret(req)) return unauthorized()

  const packages = trackedRepos.npm as NpmPackage[]

  const result = await runBatch('npm', packages, async (item) => {
    return fetchNpmPackage(item.name)
  })

  return NextResponse.json({
    source: 'npm',
    ...result,
  })
}
