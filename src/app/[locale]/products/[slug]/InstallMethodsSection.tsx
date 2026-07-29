import { useTranslations } from 'next-intl'
import { SectionHeading } from '@/components/product/SectionHeading'
import { ProductCard } from '@/components/product/ProductCard'
import { Badge } from '@/components/ui/badge'

interface InstallMethod {
  method: string
  label: string
  commands: string[]
  extracted: boolean
  needsTechnicalReview: boolean
  source?: string
}

interface Props {
  methods: InstallMethod[]
}

export function InstallMethodsSection({ methods }: Props) {
  if (methods.length === 0) return null

  const t = useTranslations('Product')

  return (
    <section id="install" className="mb-section scroll-mt-24">
      <SectionHeading number="07" label={t('toc.installSelfHost')} />
      <div className="space-y-4">
        {methods.map((m, i) => (
          <ProductCard key={i}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-display font-medium text-foreground">{m.label}</h3>
              {m.extracted && (
                <Badge variant="success">{t('install.extracted')}</Badge>
              )}
              {!m.extracted && (
                <Badge variant="info">{t('install.generated')}</Badge>
              )}
              {m.needsTechnicalReview && (
                <Badge variant="warning">{t('install.verify')}</Badge>
              )}
            </div>
            {m.commands.length > 0 && (
              <pre className="overflow-x-auto rounded-lg bg-sunken p-3 text-body-sm font-mono text-foreground/90">
                {m.commands.join('\n')}
              </pre>
            )}
          </ProductCard>
        ))}
      </div>
    </section>
  )
}
