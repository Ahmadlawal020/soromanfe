import { useQuery } from '@tanstack/react-query'
import api from '#/lib/api/http'
import type { PaystackDetails } from '#/lib/types'

export type { PaystackDetails }

/** One credit deposit that contributed to an order's payment. */
export interface OrderFunding {
  depositId: number
  amount: string | number
  depositReference: string | null
  depositCreatedAt: string | null
  paystackDetails: PaystackDetails | null
  recorderFirstName: string | null
  recorderSurname: string | null
}

export interface FinanceReportOrder {
  id: number
  orderNumber: string
  reference: string
  customerId: number
  customerName?: string | null
  customerEmail?: string | null
  customerPhone?: string | null
  customerCompanyName?: string | null
  customerVirtualAccountNumber?: string | null
  customerVirtualAccountBank?: string | null
  depotName?: string | null
  productName?: string | null
  quantity: number
  price: string | number
  totalAmount: string | number
  deliveryType: 'delivery' | 'pickup'
  virtualAccountNumber?: string | null
  virtualAccountBank?: string | null
  virtualAccountName?: string | null
  paymentStatus: 'Unpaid' | 'Paid'
  status: string
  paymentConfirmedAt?: string | null
  createdAt?: string
  /** One entry per credit deposit this order drew from — empty if untracked. */
  funding: OrderFunding[]
  /** false = this order predates the allocation ledger; not an error. */
  fundingTracked: boolean
  /** >0 only on a tracked order whose balance partly came from untracked deposits. */
  unattributedAmount: number
}

export interface FinanceReportParams {
  search?: string
  paymentStatus?: 'Paid' | 'Unpaid' | 'all'
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

export function useFinanceReport(params: FinanceReportParams) {
  return useQuery({
    queryKey: ['finance-report', params],
    queryFn: async () => {
      const res = await api.get('/finance-report', { params })
      return res.data?.data as {
        orders: FinanceReportOrder[]
        totals: { count: number; totalAmount: number; trackedCount: number; notTrackedCount: number }
        pagination: { total: number; page: number; limit: number; pages: number }
      }
    },
    placeholderData: (prev) => prev,
  })
}

/** Which way a funding entry's money came in — drives the badge/section split. */
export function isPaystackFunding(f: OrderFunding): boolean {
  const ps = f.paystackDetails as Record<string, any> | null | undefined
  return Boolean(
    ps?.transactionId ||
    ps?.paystackCustomerCode ||
    (ps?.gatewayResponse && String(ps.gatewayResponse).toLowerCase() !== 'manual') ||
    (ps?.channel && ps.channel !== 'manual_bank_transfer' && ps.channel !== 'manual')
  )
}
