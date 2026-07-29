'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

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

export function SimilarToolsGrid({ products }: Props) {
  const t = useTranslations('Product')

  if (products.length === 0) return null

  return (
    <section id="similar-tools" className="scroll-mt-24">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          {t('toc.similarTools')}
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.slug}`} className="group">
            <Card className="h-full p-5 transition-all duration-fast hover:-translate-y-0.5 hover:shadow-elevation-2">
              <div className="mb-3 flex items-center gap-3">
                {p.logoUrl ? (
                  <img
                    src={p.logoUrl}
                    alt={`${p.name} logo`}
                    className="size-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-body-sm font-bold text-muted-foreground">
                    {p.name[0]}
                  </div>
                )}
                <h3 className="truncate font-semibold text-foreground group-hover:text-brand group-hover:underline">
                  {p.name}
                </h3>
              </div>
              <p className="line-clamp-2 text-body-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}
