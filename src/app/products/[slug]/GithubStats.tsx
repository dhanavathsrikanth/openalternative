'use client'

import { useState, useEffect } from 'react'

interface Props {
  url: string
}

interface GitHubData {
  stars: number
  forks: number
  openIssues: number
  language: string | null
  pushedAt: string | null
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function GithubStats({ url }: Props) {
  const [data, setData] = useState<GitHubData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const owner = url.split('github.com/')[1]?.split('/')[0]
    const repo = url.split('github.com/')[1]?.split('/')[1]?.replace(/\.git$/, '')
    if (!owner || !repo) {
      setError(true)
      setLoading(false)
      return
    }

    fetch(`https://api.github.com/repos/${owner}/${repo}`)
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((d) => {
        setData({
          stars: d.stargazers_count ?? 0,
          forks: d.forks_count ?? 0,
          openIssues: d.open_issues_count ?? 0,
          language: d.language ?? null,
          pushedAt: d.pushed_at ?? null,
        })
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [url])

  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-3 h-4 w-32 rounded bg-muted" />
        <div className="flex gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-16 rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return null
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-medium text-muted-foreground">
        GitHub Stats
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <span className="block text-2xl font-bold tabular-nums">
            {formatNumber(data.stars)}
          </span>
          <span className="text-xs text-muted-foreground">Stars</span>
        </div>
        <div>
          <span className="block text-2xl font-bold tabular-nums">
            {formatNumber(data.forks)}
          </span>
          <span className="text-xs text-muted-foreground">Forks</span>
        </div>
        <div>
          <span className="block text-2xl font-bold tabular-nums">
            {formatNumber(data.openIssues)}
          </span>
          <span className="text-xs text-muted-foreground">Issues</span>
        </div>
        <div>
          <span className="block text-2xl font-bold">
            {data.language ?? '—'}
          </span>
          <span className="text-xs text-muted-foreground">Language</span>
        </div>
      </div>
      {data.pushedAt && (
        <p className="mt-4 text-xs text-muted-foreground">
          Last push: {timeAgo(data.pushedAt)}
        </p>
      )}
    </div>
  )
}
