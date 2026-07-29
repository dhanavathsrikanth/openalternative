import { useTranslations } from 'next-intl'

const METHOD_ICONS: Record<string, string> = {
  docker: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  npm: 'M4 4h16v16H4z',
  pip: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5',
  cargo: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  binary: 'M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9l-7-7zM13 2v7h7',
  source: 'M4 6h16M4 12h16M4 18h16',
}

const METHOD_LABELS: Record<string, string> = {
  docker: 'Docker',
  npm: 'npm',
  pip: 'pip',
  cargo: 'cargo',
  binary: 'Binary',
  source: 'Source',
}

interface Props {
  methods: string[] | null
}

export function DeploymentMethods({ methods }: Props) {
  const t = useTranslations('Product')

  if (!methods || methods.length === 0) {
    return (
      <p className="text-body-sm text-muted-foreground">
        {t('deployment.noneDetected')}
      </p>
    )
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {methods.map((m) => (
        <li
          key={m}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-body-sm"
        >
          <svg
            className="h-4 w-4 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={METHOD_ICONS[m] ?? METHOD_ICONS.source} />
          </svg>
          {METHOD_LABELS[m] ?? m}
        </li>
      ))}
    </ul>
  )
}
