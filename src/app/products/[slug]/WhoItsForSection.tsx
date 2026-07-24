interface Persona {
  persona: string
  useCase: string
  skipIf: string
}

interface Props {
  personas: Persona[]
}

export function WhoItsForSection({ personas }: Props) {
  return (
    <section id="who-its-for" className="mb-10 scroll-mt-24">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        02 &middot; Who it&apos;s for
      </h2>
      <div className="space-y-4">
        {personas.map((p, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-semibold text-foreground">{p.persona}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {p.useCase}
            </p>
            {p.skipIf && (
              <p className="mt-2 text-xs text-orange-600 dark:text-orange-400">
                Skip if: {p.skipIf}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
