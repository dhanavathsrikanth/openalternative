'use client'

import { useEffect } from 'react'

export default function ProductPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Product page error:', error)
  }, [error])

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-destructive">Something went wrong</h1>
        <p className="mb-4 text-muted-foreground">An unexpected error occurred while loading this product.</p>
        <details className="mb-4 text-left">
          <summary className="cursor-pointer font-mono text-sm text-destructive">
            Error details
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-black/5 p-4 text-xs font-mono text-red-400">
            {error.message}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
        <button
          onClick={reset}
          className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
