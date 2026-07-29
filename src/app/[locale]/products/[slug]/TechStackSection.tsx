'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { DetectedTech } from '@/lib/content-gen/tech-detect'
import { getTechIcon, CATEGORY_ICON_COLORS } from '@/lib/tech-icons'
import { SectionHeading } from '@/components/product/SectionHeading'
import { ProductCard } from '@/components/product/ProductCard'

interface Props {
  techStack: DetectedTech[]
}

const VISIBLE_LIMIT = 8

function TechPill({ tech }: { tech: DetectedTech }) {
  const icon = getTechIcon(tech.name)

  if (!icon) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-body-xs font-medium text-foreground/80">
        {tech.name}
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-body-xs font-medium text-foreground/80"
      title={tech.name}
    >
      <svg
        className="size-4 shrink-0"
        viewBox="0 0 24 24"
        style={{ color: icon.color }}
        aria-hidden="true"
      >
        {icon.svg}
      </svg>
      {tech.name}
    </span>
  )
}

export function TechStackSection({ techStack }: Props) {
  if (techStack.length === 0) return null

  const t = useTranslations('Product')

  const byCategory = new Map<string, DetectedTech[]>()
  for (const tech of techStack) {
    if (!byCategory.has(tech.category)) byCategory.set(tech.category, [])
    byCategory.get(tech.category)!.push(tech)
  }

  return (
    <section id="tech-stack" className="mb-section scroll-mt-24">
      <SectionHeading number="08" label={t('toc.techStack')} />
      <ProductCard>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...byCategory.entries()].map(([category, techs]) => (
            <CategoryGroup key={category} category={category} techs={techs} />
          ))}
        </div>
      </ProductCard>
    </section>
  )
}

function CategoryGroup({ category, techs }: { category: string; techs: DetectedTech[] }) {
  const [expanded, setExpanded] = useState(false)
  const hasOverflow = techs.length > VISIBLE_LIMIT
  const visible = expanded || !hasOverflow ? techs : techs.slice(0, VISIBLE_LIMIT)
  const hiddenCount = techs.length - VISIBLE_LIMIT

  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: CATEGORY_ICON_COLORS[category] ?? 'hsl(var(--color-text-tertiary))' }}
          aria-hidden="true"
        />
        <h3 className="text-body-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {category}
        </h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((tech) => (
          <TechPill key={tech.name} tech={tech} />
        ))}
        {hasOverflow && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex items-center rounded-full border border-dashed bg-background px-2.5 py-1 text-body-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            +{hiddenCount} more
          </button>
        )}
      </div>
    </div>
  )
}
