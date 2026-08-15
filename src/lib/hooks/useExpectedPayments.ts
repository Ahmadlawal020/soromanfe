import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'

/** What a customer said they'd pay, before the money actually shows up. Purely advisory. */
export interface ExpectedPayment {
  id: number
  customerId: number
  orderId: number | null
  expectedAmount: string | number | null
  reference: string
  note: string
  status: 'pending' | 'resolved' | 'cancelled'
  matchedDepositId: number | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
  customerName?: string | null
  customerPhone?: string | null
  orderNumber?: string | null
  createdByFirstName?: string | null
  createdBySurname?: string | null
}

export function useExpectedPayments(params?: { customerId?: string | number; orderId?: string | number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['expected-payments', params],
    queryFn: async () => {
      const res = await api.get('/expected-payments', { params })
      return (res.data?.data?.expectedPayments || []) as ExpectedPayment[]
    },
    // Scoped to one customer or order by default — an unscoped fetch would
    // pull every staff member's notes, which no current caller wants.
    enabled: !!(params?.customerId || params?.orderId),
  })
}

export function useCreateExpectedPayment() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: { customerId: string | number; orderId?: string | number; expectedAmount?: number; reference?: string; note?: string }) => {
      const res = await api.post('/expected-payments', data)
      return res.data?.data?.expectedPayment as ExpectedPayment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expected-payments'] })
      toast.success('Expected payment noted')
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  })
}

export function useResolveExpectedPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, depositId }: { id: string | number; depositId: string | number }) => {
      const res = await api.patch(`/expected-payments/${id}/resolve`, { depositId })
      return res.data?.data?.expectedPayment as ExpectedPayment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expected-payments'] })
    },
    // Deliberately silent — resolving is bookkeeping alongside the deposit
    // that already succeeded; a failure here must not read as the deposit failing.
  })
}

export function useCancelExpectedPayment() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (id: string | number) => {
      const res = await api.patch(`/expected-payments/${id}/cancel`)
      return res.data?.data?.expectedPayment as ExpectedPayment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expected-payments'] })
      toast.success('Cancelled')
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  })
}
