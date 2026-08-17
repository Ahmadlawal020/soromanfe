import { useQuery } from '@tanstack/react-query'
import { endOfDay, isWithinInterval, startOfDay } from 'date-fns'
import api from '#/lib/api/http'
import type { Order } from '#/lib/types'
import type { ReportType } from './-report-config'

const PAGE_LIMIT = 100

/**
 * Every order created on one date, company-wide.
 *
 * Reports are filed per PFI, but the API has no "orders for this PFI on this
 * date" endpoint — only date-bounded listing. Fetching one day and grouping
 * client-side (by pfiId, by price, by customer) is what the Reports Hub and
 * the security report already do for the same reason.
 */
async function fetchOrdersForDate(date: string): Promise<Order[]> {
  const all: Order[] = []
  let page = 1
  while (true) {
    const res = await api.get('/orders', {
      params: { dateFrom: date, dateTo: date, page, limit: PAGE_LIMIT },
    })
    const { orders, pagination } = res.data.data as { orders: Order[]; pagination?: { pages?: number } }
    all.push(...orders)
    if (!pagination?.pages || page >= pagination.pages || orders.length < PAGE_LIMIT) break
    page++
  }
  return all
}

export function useDayOrders(date: string, enabled: boolean) {
  return useQuery({
    queryKey: ['daily-reports-day-orders', date],
    queryFn: () => fetchOrdersForDate(date),
    enabled: enabled && !!date,
  })
}

export const ordersForPfi = (orders: Order[], pfiId: string | number | null | undefined) => (
  pfiId ? orders.filter((o) => Number(o.pfiId) === Number(pfiId)) : []
)

export const sumQuantity = (orders: Order[]) => orders.reduce((s, o) => s + Number(o.quantity || 0), 0)
export const sumAmount = (orders: Order[]) => orders.reduce((s, o) => s + Number(o.totalAmount || 0), 0)

/** Groups by unit price so a day sold at several prices seeds one band each. */
export function suggestPriceBands(orders: Order[]): Array<{ price: number; litres: number }> {
  const byPrice = new Map<number, number>()
  for (const o of orders) {
    const price = Math.round(Number(o.price || 0) * 100) / 100
    byPrice.set(price, (byPrice.get(price) || 0) + Number(o.quantity || 0))
  }
  return [...byPrice.entries()]
    .map(([price, litres]) => ({ price, litres }))
    .sort((a, b) => a.price - b.price)
}

export type TopCustomer = { name: string; phone: string; litres: number }

export function topCustomersFrom(orders: Order[], n = 5): TopCustomer[] {
  const byCustomer = new Map<number, TopCustomer>()
  for (const o of orders) {
    if (!o.customerId) continue
    const cur = byCustomer.get(o.customerId) || { name: o.customerName || '', phone: o.customerPhone || '', litres: 0 }
    cur.litres += Number(o.quantity || 0)
    byCustomer.set(o.customerId, cur)
  }
  return [...byCustomer.values()].sort((a, b) => b.litres - a.litres).slice(0, n)
}

/**
 * Gate-in/gate-out counts for one location on one date, from the real truck
 * timestamps rather than a hand-typed guess.
 *
 * Mirrors security-report's own build(): candidates are that day's orders at
 * the location that reached loading, then each order's trucks are fetched to
 * read security_entered_at / security_exited_at. N+1, but bounded to one
 * location's one day, matching the existing precedent for this data.
 */
export function useGateTruckCounts(dayOrders: Order[] | undefined, location: string, date: string, enabled: boolean) {
  return useQuery({
    queryKey: ['daily-reports-gate-counts', location, date],
    queryFn: async () => {
      const candidates = (dayOrders || []).filter(
        (o) => (o.depotName || o.state) === location && ['Loading', 'Completed'].includes(o.status),
      )
      const range = { start: startOfDay(new Date(date)), end: endOfDay(new Date(date)) }
      const batches = await Promise.all(
        candidates.map((o) => (
          api.get(`/orders/${o._id}/trucks`)
            .then((r) => r.data.data.trucks || [])
            .catch(() => [])
        )),
      )
      let entered = 0
      let exited = 0
      for (const trucks of batches) {
        for (const t of trucks as Array<{ securityEnteredAt?: string; securityExitedAt?: string }>) {
          if (t.securityEnteredAt && isWithinInterval(new Date(t.securityEnteredAt), range)) entered++
          if (t.securityExitedAt && isWithinInterval(new Date(t.securityExitedAt), range)) exited++
        }
      }
      return { entered, exited }
    },
    enabled: enabled && !!location && !!date && !!dayOrders,
  })
}

/** Yesterday's report for the same PFI and role — the read-only reference
 * a product manager's "remarks from yesterday" line points at. */
export function useYesterdayReport(
  type: ReportType, location: string, pfiNumber: string, yesterday: string, enabled: boolean,
) {
  return useQuery({
    queryKey: ['daily-reports-yesterday', type, location, pfiNumber, yesterday],
    queryFn: async () => {
      const res = await api.get('/daily-reports', {
        params: { reportType: type, location, pfiNumber, dateFrom: yesterday, dateTo: yesterday, limit: 1 },
      })
      const reports = res.data.data.reports as Array<{ remarks?: string; differentials?: string | number }>
      return reports[0] || null
    },
    enabled: enabled && !!location && !!pfiNumber,
  })
}

/** Deposits unambiguously matched to this PFI — most of the book isn't
 * attributed yet (see the deposit repo), so this reads as a floor, not a
 * guaranteed total. */
export function usePfiDeposits(pfiId: string | number | null | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['daily-reports-pfi-deposits', pfiId],
    queryFn: async () => {
      const res = await api.get('/deposits', { params: { pfiId, limit: 500 } })
      return res.data.data.deposits as Array<{ amount: string | number; createdAt?: string }>
    },
    enabled: enabled && !!pfiId,
  })
}
