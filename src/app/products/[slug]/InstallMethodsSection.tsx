interface InstallMethod {
  method: string
  label: string
  commands: string[]
  extracted: boolean
  needsTechnicalReview: boolean
  source?: string
}

interface Props {
  methods: InstallMethod[]
}

export function InstallMethodsSection({ methods }: Props) {
  if (methods.length === 0) return null

  return (
    <section id="install" className="mb-10 scroll-mt-24">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        07 &middot; Install and self-host
      </h2>
      <div className="space-y-4">
        {methods.map((m, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="font-medium text-foreground">{m.label}</h3>
              {m.extracted && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  Extracted
                </span>
              )}
              {!m.extracted && (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Generated
                </span>
              )}
              {m.needsTechnicalReview && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  Verify
                </span>
              )}
            </div>
            {m.commands.length > 0 && (
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm font-mono text-foreground/90">
                {m.commands.join('\n')}
              </pre>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
