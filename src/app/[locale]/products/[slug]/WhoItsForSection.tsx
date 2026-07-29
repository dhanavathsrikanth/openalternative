import { useTranslations } from 'next-intl'
import { SectionHeading } from '@/components/product/SectionHeading'
import { ProductCard } from '@/components/product/ProductCard'

interface Persona {
  persona: string
  useCase: string
  skipIf: string
}

interface Props {
  personas: Persona[]
}

export function WhoItsForSection({ personas }: Props) {
  const t = useTranslations('Product')

  return (
    <section id="who-its-for" className="mb-section scroll-mt-24">
      <SectionHeading number="02" label={t('toc.whoItsFor')} />
      <div className="space-y-4">
        {personas.map((p, i) => (
          <ProductCard key={i}>
            <h3 className="font-display font-semibold text-foreground">{p.persona}</h3>
            <p className="mt-2 text-body-sm text-muted-foreground leading-relaxed">
              {p.useCase}
            </p>
            {p.skipIf && (
              <p className="mt-2 text-body-xs text-warning">
                {t('skipIf')}: {p.skipIf}
              </p>
            )}
          </ProductCard>
        ))}
      </div>
    </section>
  )
}
