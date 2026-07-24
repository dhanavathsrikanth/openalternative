import Link from 'next/link'

interface SimilarProduct {
  id: number
  name: string
  slug: string
  description: string
  logoUrl: string | null
}

interface Props {
  products: SimilarProduct[]
}

export function SimilarToolsSection({ products }: Props) {
  if (products.length === 0) return null

  return (
    <section id="similar-tools" className="mb-10 scroll-mt-24">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        10 &middot; Similar tools
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="group flex flex-col rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
          >
            <div className="mb-2 flex items-center gap-2">
              {p.logoUrl ? (
                <img
                  src={p.logoUrl}
                  alt={`${p.name} logo`}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                  {p.name[0]}
                </div>
              )}
              <h3 className="truncate font-semibold text-foreground group-hover:underline">
                {p.name}
              </h3>
            </div>
            <p className="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
              {p.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
