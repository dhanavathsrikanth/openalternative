interface Props {
  tldr: string
}

export function TldrSection({ tldr }: Props) {
  return (
    <section id="tldr" className="mb-10 scroll-mt-24">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        01 &middot; TL;DR
      </h2>
      <p className="text-lg leading-relaxed text-foreground/90">
        {tldr}
      </p>
    </section>
  )
}
