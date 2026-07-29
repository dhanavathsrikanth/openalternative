import { getTranslations } from 'next-intl/server'

const faqItemIds = [
  'whatIsForklane',
  'howDecideTools',
  'areToolsFree',
  'howCurrent',
  'howToList',
  'findReplacement',
] as const

export async function FaqJsonLd() {
  const t = await getTranslations('FAQ')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItemIds.map((id) => ({
      '@type': 'Question',
      name: t(`items.${id}.question`),
      acceptedAnswer: {
        '@type': 'Answer',
        text: t(`items.${id}.answer`),
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
