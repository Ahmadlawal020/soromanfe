import api from '#/lib/api/http'
import type { DailyReportStatus, ReportType } from '#/routes/my-report/-report-config'

export type { DailyReportStatus }

/** A row from `/daily-reports`. Only the fields every view of this page
 * touches by name are typed; role-specific figures are read by field key
 * off the index signature, driven by each type's own field list. */
export type DailyReportRow = {
  id: number
  reportType: ReportType
  reportDate: string
  location: string
  pfiNumber: string
  submittedByName: string
  status: DailyReportStatus
  reviewedByName: string | null
  reviewComment: string | null
  [key: string]: unknown
}

const PAGE_LIMIT = 100

/**
 * Every report filed on one date, across every location and role.
 *
 * The server caps a page at 100 and this asks for every page — a busy day
 * across several locations can outgrow one page, and the Hub needs the whole
 * day to group and total correctly, not just whatever fit in the first 100.
 */
export async function fetchDailyReportsForDate(date: string): Promise<DailyReportRow[]> {
  const all: DailyReportRow[] = []
  let page = 1
  while (true) {
    const res = await api.get('/daily-reports', {
      params: { dateFrom: date, dateTo: date, page, limit: PAGE_LIMIT, sort: 'location', order: 'asc' },
    })
    const { reports, pagination } = res.data.data as {
      reports: DailyReportRow[]
      pagination?: { pages?: number }
    }
    all.push(...reports)
    if (!pagination?.pages || page >= pagination.pages || reports.length < PAGE_LIMIT) break
    page++
  }
  return all
}
