import { useTranslations } from 'next-intl'
import { SectionHeading } from '@/components/product/SectionHeading'

interface Props {
  problem: string
}

export function ProblemSection({ problem }: Props) {
  const t = useTranslations('Product')

  return (
    <section id="problem" className="mb-section scroll-mt-24">
      <SectionHeading number="03" label={t('toc.theProblem')} />
      <p className="text-body-md leading-relaxed text-foreground/90">
        {problem}
      </p>
    </section>
  )
}
