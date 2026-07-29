import { ProductPageSkeleton } from "@/components/Skeletons"

export default function ProductSlugLoading() {
  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      <nav className="mb-6 text-sm text-muted-foreground">
        <span className="inline-block h-4 w-16 rounded bg-surface-raised animate-pulse-skeleton" />
        <span className="mx-2">/</span>
        <span className="inline-block h-4 w-24 rounded bg-surface-raised animate-pulse-skeleton" />
      </nav>
      <ProductPageSkeleton />
    </main>
  )
}
