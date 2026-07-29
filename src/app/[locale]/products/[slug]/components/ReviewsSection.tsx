'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { ReviewForm } from '../ReviewForm'

interface Review {
  id: number
  rating: number
  body: string
  createdAt: Date
  contributorName: string | null
}

interface Props {
  productId: number
  reviews: Review[]
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-500" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(rating)}
      {'☆'.repeat(5 - rating)}
    </span>
  )
}

export function ReviewsSection({ productId, reviews }: Props) {
  const t = useTranslations('Product')

  return (
    <section id="reviews" className="scroll-mt-24">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          {t('reviews.heading')}
          {reviews.length > 0 && (
            <span className="ml-2 text-body-sm font-normal text-muted-foreground">
              ({reviews.length})
            </span>
          )}
        </h2>
      </div>

      {reviews.length > 0 ? (
        <div className="mb-6 space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Stars rating={review.rating} />
                <span className="text-body-sm font-medium">
                  {review.contributorName || t('reviews.anonymous')}
                </span>
                <span className="text-body-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-body-sm leading-relaxed text-muted-foreground">
                {review.body}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <p className="mb-6 text-body-sm text-muted-foreground">
          {t('reviews.empty')}
        </p>
      )}

      <Card className="p-5">
        <ReviewForm productId={productId} />
      </Card>
    </section>
  )
}
