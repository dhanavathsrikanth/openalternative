import { useTranslations } from 'next-intl'
import { SectionHeading } from '@/components/product/SectionHeading'
import { ProductCard } from '@/components/product/ProductCard'

interface Solution {
  title: string
  description: string
}

interface Props {
  solutions: Solution[]
}

export function SolutionSection({ solutions }: Props) {
  const t = useTranslations('Product')

  return (
    <section id="solution" className="mb-section scroll-mt-24">
      <SectionHeading number="04" label={t('toc.howItSolvesIt')} />
      <div className="space-y-3">
        {solutions.map((s, i) => (
          <ProductCard key={i}>
            <h3 className="font-display font-medium text-foreground">{s.title}</h3>
            <p className="mt-1.5 text-body-sm text-muted-foreground leading-relaxed">
              {s.description}
            </p>
          </ProductCard>
        ))}
      </div>
    </section>
  )
}
