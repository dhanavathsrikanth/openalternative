import { ProductGridSkeleton } from "@/components/Skeletons"

export default function Loading() {
  return (
    <main className="min-h-screen pt-[var(--header-height)]">
        <div className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded bg-surface-raised animate-pulse-skeleton" />
            <div className="h-4 w-96 rounded bg-surface-raised animate-pulse-skeleton" />
          </div>
          <ProductGridSkeleton />
        </div>
      </div>
    </main>
  )
}