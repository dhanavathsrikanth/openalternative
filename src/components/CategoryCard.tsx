import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Badge } from '@/components/ui/badge'

interface Props {
  category: {
    id: number
    name: string
    slug: string
    description: string | null
    productCount: number
  }
}

export function CategoryCard({ category }: Props) {
  return (
    <Link href={`/categories/${category.slug}`} className="group block">
      <Card className="h-full transition-colors duration-fast ease-out group-hover:bg-accent/50 card-lift">
        <CardContent className="p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <CategoryIcon categorySlug={category.slug} />
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {category.productCount}
            </Badge>
          </div>
          <h3 className="font-semibold group-hover:text-foreground">{category.name}</h3>
          {category.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {category.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
