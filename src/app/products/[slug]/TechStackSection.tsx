import type { DetectedTech } from '@/lib/content-gen/tech-detect'

interface Props {
  techStack: DetectedTech[]
}

export function TechStackSection({ techStack }: Props) {
  if (techStack.length === 0) return null

  const byCategory = new Map<string, DetectedTech[]>()
  for (const tech of techStack) {
    if (!byCategory.has(tech.category)) byCategory.set(tech.category, [])
    byCategory.get(tech.category)!.push(tech)
  }

  return (
    <section id="tech-stack" className="mb-10 scroll-mt-24">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        08 &middot; Tech stack
      </h2>
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {[...byCategory.entries()].map(([category, techs]) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {category}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {techs.map((t) => (
                  <span
                    key={t.name}
                    className="inline-flex items-center rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground/80"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
