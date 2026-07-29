import { NextRequest, NextResponse } from 'next/server'
import { verifySecret, unauthorized, runBatch } from '@/lib/ingest'
import { fetchCrate } from '@/lib/fetchers/crates'
import trackedRepos from '../../../../../data/tracked-repos.json'

interface CratesCrate {
  name: string
  category: string
}

export async function GET(req: NextRequest) {
  if (!verifySecret(req)) return unauthorized()

  const crates = trackedRepos.crates as CratesCrate[]

  const result = await runBatch('crates', crates, async (item) => {
    return fetchCrate(item.name)
  })

  return NextResponse.json({
    source: 'crates',
    ...result,
  })
}
