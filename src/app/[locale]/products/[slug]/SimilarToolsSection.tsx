import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { SectionHeading } from '@/components/product/SectionHeading'
import { ProductCard } from '@/components/product/ProductCard'

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

  const t = useTranslations('Product')

  return (
    <section id="similar-tools" className="mb-section scroll-mt-24">
      <SectionHeading number="10" label={t('toc.similarTools')} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="group"
          >
            <ProductCard className="h-full transition-colors hover:bg-accent/50">
              <div className="mb-2 flex items-center gap-2">
                {p.logoUrl ? (
                  <img
                    src={p.logoUrl}
                    alt={`${p.name} logo`}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-body-xs font-bold text-muted-foreground">
                    {p.name[0]}
                  </div>
                )}
                <h3 className="truncate font-display font-semibold text-foreground group-hover:underline">
                  {p.name}
                </h3>
              </div>
              <p className="line-clamp-2 text-body-sm text-muted-foreground leading-relaxed">
                {p.description}
              </p>
            </ProductCard>
          </Link>
        ))}
      </div>
    </section>
  )
}
