import Link from 'next/link'
import type { Product } from '@/app/db/schema'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LicenseBadge } from '@/app/products/[slug]/LicenseBadge'

interface Props {
  product: Pick<Product, 'id' | 'name' | 'slug' | 'description' | 'license' | 'primaryLanguage' | 'confidenceScore'>
}

function getScoreVariant(score: number): 'success' | 'warning' | 'info' | 'destructive' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  if (score >= 40) return 'info'
  return 'destructive'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'High'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Moderate'
  return 'Low'
}

export function ProductCard({ product }: Props) {
  const score = product.confidenceScore ? parseFloat(product.confidenceScore) : null

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="h-full transition-colors group-hover:bg-accent/50">
        <CardContent className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold group-hover:text-foreground">{product.name}</h3>
                {product.primaryLanguage && (
                  <span className="text-xs text-muted-foreground">{product.primaryLanguage}</span>
                )}
              </div>
            </div>
            {score !== null && (
              <Badge variant={getScoreVariant(score)} className="shrink-0 tabular-nums">
                {Math.round(score)} · {getScoreLabel(score)}
              </Badge>
            )}
          </div>

          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {product.license && <LicenseBadge license={product.license} />}
            {score === null && (
              <Badge variant="outline" className="text-muted-foreground">
                Not yet scored
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
