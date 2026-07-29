import { useTranslations } from 'next-intl'

interface Props {
  score: number | null
}

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-yellow-500'
  if (score >= 40) return 'text-warning'
  return 'text-destructive'
}

export function ConfidenceGauge({ score }: Props) {
  const t = useTranslations('Product')

  if (score === null) {
    return (
      <div className="flex h-28 items-center justify-center text-muted-foreground">
        {t('confidence.notYetScored')}
      </div>
    )
  }

  const rounded = Math.round(score)
  const offset = CIRCUMFERENCE - (rounded / 100) * CIRCUMFERENCE
  const colorClass = getScoreColor(rounded)
  const label = t(`confidence.${rounded >= 80 ? 'high' : rounded >= 60 ? 'good' : rounded >= 40 ? 'moderate' : 'low'}`)

  return (
    <div className="flex items-center gap-5">
      <svg
        className={`h-20 w-20 -rotate-90 ${colorClass}`}
        viewBox="0 0 120 120"
        aria-label={`${t('sidebar.migrationConfidence')}: ${rounded} out of 100`}
      >
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="opacity-15"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div>
        <span className="block text-3xl font-bold tabular-nums">{rounded}</span>
        <span className="text-body-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
