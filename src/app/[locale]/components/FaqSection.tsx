'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqItemIds = [
  'whatIsForklane',
  'howDecideTools',
  'areToolsFree',
  'howCurrent',
  'howToList',
  'findReplacement',
] as const

// Single-open mode: only one accordion item can be expanded at a time.
export function FaqSection() {
  const t = useTranslations('FAQ')

  return (
    <section className="border-t bg-card">
      <div className="mx-auto max-w-3xl px-6 lg:px-8 py-12">
        <h2 className="mb-2 text-2xl font-semibold">{t('heading')}</h2>
        <p className="mb-8 text-muted-foreground">
          {t('subtitle')}
        </p>

        <Accordion defaultValue={[]}>
          {faqItemIds.map((id) => (
            <AccordionItem key={id} value={id}>
              <AccordionTrigger>{t(`items.${id}.question`)}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{t(`items.${id}.answer`)}</p>
                {id === 'howToList' && (
                  <Link
                    href="/contributor/sign-up"
                    className="mt-2 inline-block text-sm font-medium underline underline-offset-3 hover:text-foreground"
                  >
                    {t('contributorLink')} →
                  </Link>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
