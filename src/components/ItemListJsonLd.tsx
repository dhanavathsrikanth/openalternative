interface Item {
  position: number
  name: string
  url: string
}

interface Props {
  name: string
  description?: string
  items: Item[]
}

/**
 * Renders a schema.org ItemList as JSON-LD.
 * References products by URL — does NOT re-embed their full SoftwareApplication schema,
 * avoiding duplication with the per-product JSON-LD on detail pages.
 */
export function ItemListJsonLd({ name, description, items }: Props) {
  if (items.length === 0) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    ...(description && { description }),
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      url: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
