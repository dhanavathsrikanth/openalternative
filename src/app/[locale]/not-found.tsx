import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function NotFound() {
  const t = await getTranslations('NotFound')

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 lg:px-8 py-12 text-center pt-[var(--header-height)]">
      <p className="text-6xl font-bold tabular-nums text-muted-foreground">{t('code')}</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">
        {t('description')}
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
      >
        {t('back')}
      </Link>
    </main>
  )
}
