'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LicenseBadge } from '@/app/products/[slug]/LicenseBadge'
import Link from 'next/link'

interface SearchResult {
  id: number
  name: string
  slug: string
  description: string
  license: string | null
  primaryLanguage: string | null
  deploymentMethods: string[] | null
  confidenceScore: string | null
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
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (license) params.set('license', license)
    if (language) params.set('language', language)
    if (deployment) params.set('deployment', deployment)
    router.push(`/search?${params}`)
    doSearch(query, license, language, deployment)
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
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
            <div key={i} className="animate-pulse rounded-xl border bg-card p-6">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="mt-2 h-4 w-64 rounded bg-muted" />
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
                  className="block rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent"
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
                    {r.confidenceScore && (
                      <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium tabular-nums">
                        {Math.round(parseFloat(r.confidenceScore))}
                      </span>
                    )}
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
