interface Props {
  problem: string
}

export function ProblemSection({ problem }: Props) {
  return (
    <section id="problem" className="mb-10 scroll-mt-24">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        03 &middot; The problem it solves
      </h2>
      <p className="text-base leading-relaxed text-foreground/90">
        {problem}
      </p>
    </section>
  )
}
