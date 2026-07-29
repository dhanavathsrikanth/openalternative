import type { Product } from '@/app/db/schema'
import { getTranslations } from 'next-intl/server'
import { extractFaqPairs, extractInstallSteps } from '@/lib/blocks/extract-structured-data'

interface InstallMethod {
  method: string
  label: string
  commands: string[]
  extracted: boolean
}

interface Props {
  product: Product
  logoUrl?: string | null
  installMethods?: InstallMethod[] | null
  faqPairs?: { question: string; answer: string }[] | null
  contentBlocks?: unknown[] | null
}

function buildSoftwareApplication(product: Product, logoUrl: string | null | undefined, t: Awaited<ReturnType<typeof getTranslations>>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: product.description,
    url: product.homepageUrl ?? product.githubUrl ?? `https://forklane.dev/products/${product.slug}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    ...(logoUrl && { image: logoUrl }),
    ...(product.license && {
      license: `https://spdx.org/licenses/${product.license}`,
    }),
    ...(product.primaryLanguage && {
      runtimePlatform: product.primaryLanguage,
    }),
    ...(product.githubUrl && {
      codeRepository: product.githubUrl,
    }),
    ...(product.confidenceScore && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Math.round(parseFloat(product.confidenceScore) / 20),
        bestRating: 5,
        ratingCount: 1,
        name: t('jsonLd.migrationConfidenceScore'),
      },
    }),
  }
}

function buildFaqPage(faqPairs: { question: string; answer: string }[]) {
  if (faqPairs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqPairs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }
}

function buildHowTo(steps: { label: string; commands: string[] }[], t: Awaited<ReturnType<typeof getTranslations>>) {
  if (steps.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: t('jsonLd.howToInstall'),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.label,
      text: s.commands.join('\n'),
    })),
  }
}

export async function ProductJsonLd({ product, logoUrl, installMethods, faqPairs, contentBlocks }: Props) {
  const t = await getTranslations('Product')

  const resolvedFaqPairs = faqPairs && faqPairs.length > 0
    ? faqPairs
    : extractFaqPairs(contentBlocks)

  const resolvedInstallSteps = installMethods && installMethods.length > 0
    ? installMethods.map((m) => ({ label: m.label, commands: m.commands }))
    : extractInstallSteps(contentBlocks)

  const softwareApp = buildSoftwareApplication(product, logoUrl, t)
  const faqPage = buildFaqPage(resolvedFaqPairs)
  const howTo = buildHowTo(resolvedInstallSteps, t)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApp) }}
      />
      {faqPage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
        />
      )}
      {howTo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }}
        />
      )}
    </>
  )
}
