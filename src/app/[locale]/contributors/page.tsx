import { db } from '@/app/db'
import { Contributors, Contributions } from '@/app/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export const revalidate = 86400 // 24h ISR

export default async function ContributorsPage() {
  const tCommon = await getTranslations('Common')
  const tContributors = await getTranslations('Contributors')

  const contributors = await db
    .select({
      id: Contributors.id,
      displayName: Contributors.displayName,
      reputationPoints: Contributors.reputationPoints,
      createdAt: Contributors.createdAt,
      contributionCount: sql<number>`count(${Contributions.id})::int`,
    })
    .from(Contributors)
    .leftJoin(Contributions, eq(Contributors.id, Contributions.contributorId))
    .groupBy(Contributors.id)
    .orderBy(desc(Contributors.reputationPoints))

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{tCommon('brand')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{tContributors('heading')}</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">{tContributors('heading')}</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {tContributors('description')}
      </p>

      {contributors.length === 0 ? (
        <p className="text-muted-foreground">{tContributors('empty')}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{tContributors('table.rank')}</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{tContributors('table.name')}</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{tContributors('table.reputation')}</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{tContributors('table.edits')}</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{tContributors('table.joined')}</th>
              </tr>
            </thead>
            <tbody>
              {contributors.map((c, i) => (
                <tr
                  key={c.id}
                  className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                >
                  <td className="px-4 py-3 font-medium tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {c.displayName}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
                      {c.reputationPoints}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {c.contributionCount}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {c.createdAt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
