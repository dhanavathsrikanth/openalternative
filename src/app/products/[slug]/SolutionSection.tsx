interface Solution {
  title: string
  description: string
}

interface Props {
  solutions: Solution[]
}

export function SolutionSection({ solutions }: Props) {
  return (
    <section id="solution" className="mb-10 scroll-mt-24">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        04 &middot; How it solves it
      </h2>
      <div className="space-y-3">
        {solutions.map((s, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="font-medium text-foreground">{s.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {s.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
