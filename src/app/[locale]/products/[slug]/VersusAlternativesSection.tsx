import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { SectionHeading } from '@/components/product/SectionHeading'
import { ProductCard } from '@/components/product/ProductCard'

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

  const t = useTranslations('Product')

  return (
    <section id="versus" className="mb-section scroll-mt-24">
      <SectionHeading number="06" label={t('toc.versusAlternatives')} />
      <div className="space-y-6">
        {comparisons.map((comp) => {
          const target = targets.find((tgt) => tgt.id === comp.comparedProductId)
          return (
            <ProductCard key={comp.comparedProductId}>
              <div className="mb-3 flex items-center gap-3">
                {target?.logoUrl && (
                  <img
                    src={target.logoUrl}
                    alt={`${comp.comparedProductName} logo`}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                )}
                <h3 className="font-display font-semibold text-foreground">
                  {target ? (
                    <Link href={`/products/${target.slug}`} className="hover:underline">
                      {comp.comparedProductName}
                    </Link>
                  ) : (
                    comp.comparedProductName
                  )}
                </h3>
              </div>
              <p className="text-body-sm text-muted-foreground leading-relaxed">
                {comp.body}
              </p>
              {comp.summary && (
                <p className="mt-3 text-body-sm font-medium text-foreground/80 border-t border-border-subtle pt-3">
                  {comp.summary}
                </p>
              )}
            </ProductCard>
          )
        })}
      </div>
    </section>
  )
}
