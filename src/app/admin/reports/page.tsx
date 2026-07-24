import { ReportsQueue } from './ReportsQueue'
import { db } from '@/app/db'
import { Reports } from '@/app/db/schema'
import { desc, eq } from 'drizzle-orm'

export default async function AdminReportsPage() {
  const reports = await db
    .select({
      id: Reports.id,
      productId: Reports.productId,
      reason: Reports.reason,
      detail: Reports.detail,
      reporterId: Reports.reporterId,
      status: Reports.status,
      createdAt: Reports.createdAt,
    })
    .from(Reports)
    .where(eq(Reports.status, 'pending'))
    .orderBy(desc(Reports.createdAt))
    .limit(100)

  return <ReportsQueue contributions={reports} />
}