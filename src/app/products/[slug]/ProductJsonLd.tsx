import type { Product } from '@/app/db/schema'

interface Props {
  product: Product
}

export function ProductJsonLd({ product }: Props) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: product.description,
    url: product.homepageUrl ?? product.githubUrl ?? `https://forklane.dev/products/${product.slug}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
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
        name: 'Migration Confidence Score',
      },
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
