'use client'

import { useTranslations } from 'next-intl'
import posthog from 'posthog-js'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  posthog.captureException(error)
  const t = useTranslations('Error')

  return (
    <main className="min-h-screen bg-[#1A1A1A] flex items-center justify-center pt-[var(--header-height)]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">{t('title')}</h2>
        <p className="text-gray-400 mb-6">{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[#00E699] text-black rounded-md hover:bg-[#00e5BF] transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    </main>
  )
}
