'use client'

import type { Contributor } from '@/app/db/schema'
import Link from 'next/link'

interface Props {
  contributor: Contributor
}

export function ContributorDashboard({ contributor }: Props) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Forklane</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Contributor Dashboard</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">Welcome, {contributor.displayName}</h1>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Reputation Points</h2>
          <span className="text-4xl font-bold tabular-nums">{contributor.reputationPoints}</span>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Email</h2>
          <span className="text-lg">{contributor.email}</span>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Browse Products to Edit →
        </Link>
      </div>
    </main>
  )
}
