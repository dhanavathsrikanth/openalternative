/**
 * FeaturedToolsDisplay — pure display component (no DB).
 *
 * Accepts a pre-fetched array of tools so it can be rendered from either a
 * server component or a client component that received the data as props.
 */

import Link from 'next/link'
import { FeaturedToolCard, type FeaturedTool } from './FeaturedToolCard'

export function FeaturedToolsDisplay({ tools }: { tools: FeaturedTool[] }) {
  if (tools.length === 0) return null

  return (
    <section aria-labelledby="featured-tools-heading">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <h2
          id="featured-tools-heading"
          className="text-body-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Featured Tools
        </h2>
        <Link
          href="/products"
          className="text-body-xs font-medium text-brand underline-offset-2 hover:underline"
        >
          View all tools →
        </Link>
      </div>

      {/* 3 × 2 grid: 2 cols on small–xl, 1 col on lg sidebar (narrows back to 2 on xl) */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {tools.map((tool) => (
          <FeaturedToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  )
}
