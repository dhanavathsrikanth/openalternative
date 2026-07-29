import { useTranslations } from 'next-intl'
import { SectionHeading } from '@/components/product/SectionHeading'

interface Props {
  tldr: string
}

export function TldrSection({ tldr }: Props) {
  const t = useTranslations('Product')

  return (
    <section id="tldr" className="mb-section scroll-mt-24">
      <SectionHeading number="01" label={t('toc.tldr')} />
      <p className="text-body-lg leading-relaxed text-foreground/90">
        {tldr}
      </p>
    </section>
  )
}
