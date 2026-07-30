import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'
import type { Commission, CommissionRate, CommissionSummary } from '#/lib/types'

export function useCommissions(params?: {
  search?: string
  status?: string
  depotId?: number | string
  customerId?: number | string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['commissions', params],
    queryFn: async () => {
      const res = await api.get('/commissions', { params })
      return res.data.data as {
        commissions: Commission[]
        pagination: { total: number; page: number; pages: number }
      }
    },
  })
}

export function useCommissionDetails(id: string) {
  return useQuery({
    queryKey: ['commissions', id],
    queryFn: async () => {
      const res = await api.get(`/commissions/${id}`)
      return res.data.data.commission as Commission
    },
    enabled: !!id,
  })
}

export function useCommissionSummary(params?: { depotId?: number | string; customerId?: number | string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['commission-summary', params],
    queryFn: async () => {
      const res = await api.get('/commissions/summary', { params })
      return res.data.data.summary as CommissionSummary
    },
  })
}

export function useConfirmCommissionPayment() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (commissionId: number) => {
      const res = await api.patch(`/commissions/${commissionId}/confirm-payment`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] })
      queryClient.invalidateQueries({ queryKey: ['commission-summary'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['deposits'] })
      toast.success('Commission confirmed — amount credited to customer account')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useCommissionRates(params?: { depotId?: number | string }) {
  return useQuery({
    queryKey: ['commission-rates', params],
    queryFn: async () => {
      const res = await api.get('/commissions/rates', { params })
      return (res.data.data.rates || []) as CommissionRate[]
    },
  })
}

export function useUpsertCommissionRate() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: { depotId: number | string; productId: number | string; commissionRate: number }) => {
      const res = await api.post('/commissions/rates', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission-rates'] })
      toast.success('Commission rate saved')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
