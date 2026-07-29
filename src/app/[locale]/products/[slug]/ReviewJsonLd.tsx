import type { Product } from '@/app/db/schema'

interface ReviewData {
  ratingValue: number
  reviewBody: string
  authorName: string
  datePublished: string
}

interface Props {
  product: Product
  reviews: ReviewData[]
}

export function ReviewJsonLd({ product, reviews }: Props) {
  if (reviews.length === 0) return null

  const aggregateRating =
    reviews.length > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: (
            reviews.reduce((sum, r) => sum + r.ratingValue, 0) / reviews.length
          ).toFixed(1),
          reviewCount: reviews.length.toString(),
          bestRating: '5',
          worstRating: '1',
        }
      : null

  const reviewItems = reviews.map((r) => ({
    '@type': 'Review',
    author: { '@type': 'Person', name: r.authorName },
    datePublished: r.datePublished,
    reviewBody: r.reviewBody,
    reviewRating: {
      '@type': 'Rating',
      ratingValue: r.ratingValue.toString(),
      bestRating: '5',
      worstRating: '1',
    },
  }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: product.description,
    url: product.homepageUrl || product.githubUrl || `https://forklane.dev/products/${product.slug}`,
    applicationCategory: 'DeveloperApplication',
    ...(aggregateRating && { aggregateRating }),
    review: reviewItems,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
