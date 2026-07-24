import Link from 'next/link'

interface Comparison {
  comparedProductId: number
  comparedProductName: string
  body: string
  summary: string
}

interface Target {
  id: number
  name: string
  slug: string
  description: string
  logoUrl: string | null
}

interface Props {
  comparisons: Comparison[]
  targets: Target[]
}

export function VersusAlternativesSection({ comparisons, targets }: Props) {
  if (comparisons.length === 0) return null

  return (
    <section id="versus" className="mb-10 scroll-mt-24">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        06 &middot; Versus alternatives
      </h2>
      <div className="space-y-6">
        {comparisons.map((comp) => {
          const target = targets.find((t) => t.id === comp.comparedProductId)
          return (
            <div key={comp.comparedProductId} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                {target?.logoUrl && (
                  <img
                    src={target.logoUrl}
                    alt={`${comp.comparedProductName} logo`}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                )}
                <h3 className="font-semibold text-foreground">
                  {target ? (
                    <Link href={`/products/${target.slug}`} className="hover:underline">
                      {comp.comparedProductName}
                    </Link>
                  ) : (
                    comp.comparedProductName
                  )}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {comp.body}
              </p>
              {comp.summary && (
                <p className="mt-3 text-sm font-medium text-foreground/80 border-t pt-3">
                  {comp.summary}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
