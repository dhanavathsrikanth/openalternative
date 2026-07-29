import { NextRequest, NextResponse } from 'next/server'
import { verifySecret, unauthorized, runBatch } from '@/lib/ingest'
import { fetchPypiPackage } from '@/lib/fetchers/pypi'
import trackedRepos from '../../../../../data/tracked-repos.json'

interface PypiPackage {
  name: string
  category: string
}

export async function GET(req: NextRequest) {
  if (!verifySecret(req)) return unauthorized()

  const packages = trackedRepos.pypi as PypiPackage[]

  const result = await runBatch('pypi', packages, async (item) => {
    return fetchPypiPackage(item.name)
  })

  return NextResponse.json({
    source: 'pypi',
    ...result,
  })
}
