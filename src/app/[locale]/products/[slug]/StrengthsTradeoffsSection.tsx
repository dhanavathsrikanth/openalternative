import { useTranslations } from 'next-intl'
import { SectionHeading } from '@/components/product/SectionHeading'
import { ProductCard } from '@/components/product/ProductCard'

interface Strength {
  title: string
  signal: string
}

interface Tradeoff {
  title: string
  detail: string
}

interface Props {
  strengths: Strength[]
  tradeoffs: Tradeoff[]
}

export function StrengthsTradeoffsSection({ strengths, tradeoffs }: Props) {
  const t = useTranslations('Product')

  if (strengths.length === 0 && tradeoffs.length === 0) return null

  return (
    <section id="strengths-tradeoffs" className="mb-section scroll-mt-24">
      <SectionHeading number="05" label={t('toc.strengthsTradeoffs')} />
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Strengths column */}
        {strengths.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-body-sm font-semibold text-success">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M2 12h20" />
              </svg>
              {t('strengths')}
            </h3>
            <div className="space-y-3">
              {strengths.map((s, i) => (
                <ProductCard key={i}>
                  <h4 className="font-display font-medium text-foreground">{s.title}</h4>
                  <p className="mt-1 text-body-sm text-muted-foreground leading-relaxed">{s.signal}</p>
                </ProductCard>
              ))}
            </div>
          </div>
        )}

        {/* Tradeoffs column */}
        {tradeoffs.length > 0 && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-body-sm font-semibold text-warning">
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {t('tradeoffs')}
            </h3>
            <div className="space-y-3">
              {tradeoffs.map((tradeoff, i) => (
                <ProductCard key={i}>
                  <h4 className="font-display font-medium text-foreground">{tradeoff.title}</h4>
                  <p className="mt-1 text-body-sm text-muted-foreground leading-relaxed">{tradeoff.detail}</p>
                </ProductCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
