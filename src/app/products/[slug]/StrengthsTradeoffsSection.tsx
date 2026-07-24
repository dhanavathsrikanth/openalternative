interface Strength {
  title: string
  signal: string
}

interface Tradeoff {
  title: string
  detail: string
}

interface Props {
  strengths: Strength[]
  tradeoffs: Tradeoff[]
}

export function StrengthsTradeoffsSection({ strengths, tradeoffs }: Props) {
  return (
    <section id="strengths-tradeoffs" className="mb-10 scroll-mt-24">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        05 &middot; Strengths and trade-offs
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Strengths column */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20" />
            </svg>
            Strengths
          </h3>
          <div className="space-y-3">
            {strengths.map((s, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
                <h4 className="font-medium text-foreground">{s.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.signal}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tradeoffs column */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            Trade-offs
          </h3>
          <div className="space-y-3">
            {tradeoffs.map((t, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
                <h4 className="font-medium text-foreground">{t.title}</h4>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
