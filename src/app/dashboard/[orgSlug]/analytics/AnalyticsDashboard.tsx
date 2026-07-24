'use client'

import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface Summary {
  [eventType: string]: number
}

interface TrendPoint {
  day: string
  pageViews: number
  outboundClicks: number
}

interface Referral {
  referral_source: string
  count: number
}

interface Data {
  summary: Summary
  trend: TrendPoint[]
  referrals: Referral[]
}

const EVENT_LABELS: Record<string, string> = {
  page_view: 'Page Views',
  outbound_click: 'Outbound Clicks',
}

function formatDay(raw: string) {
  const d = new Date(raw)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function AnalyticsDashboard({ orgSlug }: { orgSlug: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/summary?days=${days}`)
      if (!res.ok) throw new Error('Failed to load analytics')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { fetchData() }, [fetchData])

  function handleExport() {
    window.open(`/api/analytics/export?days=${days}`, '_blank')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Full-history page views and outbound clicks for your products.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border bg-background px-3 py-1.5 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <button
            onClick={handleExport}
            className="rounded-lg border bg-card px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Export CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-16" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <Skeleton className="mb-4 h-5 w-16" />
            <Skeleton className="h-[350px] w-full" />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(data.summary).map(([type, count]) => (
              <div key={type} className="rounded-xl border bg-card p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">{EVENT_LABELS[type] ?? type}</p>
                <p className="mt-1 text-3xl font-bold">{count.toLocaleString()}</p>
              </div>
            ))}
            {Object.keys(data.summary).length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full">
                No events recorded for this period.
              </p>
            )}
          </div>

          {/* Trend chart */}
          {data.trend.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Trend</h2>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data.trend}>
                  <defs>
                    <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ocGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={formatDay}
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <Tooltip
                    labelFormatter={(label) => formatDay(String(label))}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke="#6366f1"
                    fill="url(#pvGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="outboundClicks"
                    name="Outbound Clicks"
                    stroke="#f59e0b"
                    fill="url(#ocGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Referral breakdown */}
          {data.referrals.length > 0 && (
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold">Breakdown by Page / Referral</h2>
              <ResponsiveContainer width="100%" height={Math.max(200, data.referrals.length * 36)}>
                <BarChart data={data.referrals} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis
                    type="category"
                    dataKey="referral_source"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    width={115}
                  />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="count" name="Page Views" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  )
}
