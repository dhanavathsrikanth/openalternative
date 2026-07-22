import type { Metadata } from 'next'
import { SearchPage } from './SearchPage'

type PageProps = { searchParams: Promise<{ q?: string; license?: string; language?: string; deployment?: string }> }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const q = params.q ?? ''
  return {
    title: q ? `Search: ${q} — Forklane` : 'Search — Forklane',
    description: q ? `Search results for "${q}" on Forklane` : 'Search open-source alternatives on Forklane',
  }
}

export default async function SearchRoute({ searchParams }: PageProps) {
  const params = await searchParams
  return (
    <SearchPage
      initialQuery={params.q ?? ''}
      initialLicense={params.license}
      initialLanguage={params.language}
      initialDeployment={params.deployment}
    />
  )
}
