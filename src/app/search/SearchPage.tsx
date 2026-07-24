'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LicenseBadge } from '@/app/products/[slug]/LicenseBadge'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import posthog from 'posthog-js'

interface SearchResult {
  id: number
  name: string
  slug: string
  description: string
  license: string | null
  primaryLanguage: string | null
  deploymentMethods: string[] | null
  stars: number | null
  forks: number | null
  githubUrl: string | null
  rank: number
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  limit: number
  offset: number
}

interface Props {
  initialQuery: string
  initialLicense?: string
  initialLanguage?: string
  initialDeployment?: string
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

export function SearchPage({ initialQuery, initialLicense, initialLanguage, initialDeployment }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [license, setLicense] = useState(initialLicense ?? '')
  const [language, setLanguage] = useState(initialLanguage ?? '')
  const [deployment, setDeployment] = useState(initialDeployment ?? '')

  const doSearch = useCallback(async (q: string, lic: string, lang: string, dep: string) => {
    if (!q.trim() && !lic && !lang && !dep) {
      setResults([])
      setTotal(0)
      return
    }

    setLoading(true)
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (lic) params.set('license', lic)
    if (lang) params.set('language', lang)
    if (dep) params.set('deployment', dep)
    params.set('limit', '30')

    try {
      const res = await fetch(`/api/search?${params}`)
      const data: SearchResponse = await res.json()
      setResults(data.results)
      setTotal(data.total)
    } catch {
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial search on mount
  useEffect(() => {
    if (initialQuery || initialLicense || initialLanguage || initialDeployment) {
      doSearch(initialQuery, initialLicense ?? '', initialLanguage ?? '', initialDeployment ?? '')
    }
  }, [initialQuery, initialLicense, initialLanguage, initialDeployment, doSearch])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    posthog.capture('search_performed', {
      query: query.trim(),
      license_filter: license || null,
      language_filter: language || null,
      deployment_filter: deployment || null,
    })
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (license) params.set('license', license)
    if (language) params.set('language', language)
    if (deployment) params.set('deployment', deployment)
    router.push(`/search?${params}`)
    doSearch(query, license, language, deployment)
  }

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Forklane</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Search</span>
      </nav>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-8 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search open-source alternatives..."
            className="flex-1 rounded-lg border bg-background px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">All licenses</option>
            <option value="MIT">MIT</option>
            <option value="Apache-2.0">Apache 2.0</option>
            <option value="GPL-3.0">GPL 3.0</option>
            <option value="BSD-3-Clause">BSD 3-Clause</option>
          </select>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">All languages</option>
            <option value="TypeScript">TypeScript</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Python">Python</option>
            <option value="Rust">Rust</option>
            <option value="Go">Go</option>
          </select>

          <select
            value={deployment}
            onChange={(e) => setDeployment(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">All deployment</option>
            <option value="docker">Docker</option>
            <option value="npm">npm</option>
            <option value="pip">pip</option>
            <option value="cargo">cargo</option>
            <option value="binary">Binary</option>
          </select>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {total} result{total !== 1 ? 's' : ''} found
          </p>
          <ul className="space-y-3">
            {results.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/products/${r.slug}`}
                  className="block rounded-xl border bg-card p-5 shadow-sm transition-colors duration-fast ease-out hover:bg-accent card-lift"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{r.name}</h3>
                        {r.license && <LicenseBadge license={r.license} />}
                        {r.primaryLanguage && (
                          <span className="text-xs text-muted-foreground">{r.primaryLanguage}</span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      {r.stars != null && (
                        <span className="inline-flex items-center gap-1">
                          <svg className="size-3.5 shrink-0 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {formatNumber(r.stars)}
                        </span>
                      )}
                      {r.forks != null && (
                        <span className="inline-flex items-center gap-1">
                          <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /><path d="M12 12v3" />
                          </svg>
                          {formatNumber(r.forks)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (initialQuery || initialLicense || initialLanguage || initialDeployment) ? (
        <p className="text-center text-muted-foreground">No results found. Try different search terms or filters.</p>
      ) : (
        <p className="text-center text-muted-foreground">Enter a search query to find open-source alternatives.</p>
      )}
    </main>
  )
}
