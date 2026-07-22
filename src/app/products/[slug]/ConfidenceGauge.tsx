interface Props {
  score: number | null
}

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-500'
  return 'text-red-500'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'High'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Moderate'
  return 'Low'
}

export function ConfidenceGauge({ score }: Props) {
  if (score === null) {
    return (
      <div className="flex h-28 items-center justify-center text-muted-foreground">
        Not yet scored
      </div>
    )
  }

  const rounded = Math.round(score)
  const offset = CIRCUMFERENCE - (rounded / 100) * CIRCUMFERENCE
  const colorClass = getScoreColor(rounded)
  const label = getScoreLabel(rounded)

  return (
    <div className="flex items-center gap-5">
      <svg
        className={`h-20 w-20 -rotate-90 ${colorClass}`}
        viewBox="0 0 120 120"
        aria-label={`Confidence score: ${rounded} out of 100`}
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
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
