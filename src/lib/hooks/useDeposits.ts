import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'
import type { Deposit } from '#/lib/types'

export type { Deposit }

export function useDepositList(params?: { customer?: string; page?: number; limit?: number; refetchInterval?: number }) {
  const { refetchInterval, ...queryParams } = params || {}
  return useQuery({
    queryKey: ['deposits', queryParams],
    queryFn: async () => {
      const res = await api.get('/deposits', { params: queryParams })
      return res.data.data as { deposits: Deposit[]; pagination: { total: number; page: number; pages: number } }
    },
    refetchInterval: refetchInterval ?? false,
  })
}

export function useCreateDeposit() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: {
      customer: string | number
      amount?: number
      description?: string
      reference?: string
      bankAccountId?: string | number
      bankName?: string
      accountName?: string
      accountNumber?: string
      depositorName?: string
      paymentDate?: string
      paystackDetails?: Record<string, any>
      /** Claim these unmatched bank-statement lines and sum them server-side, instead of a typed amount. */
      lineIds?: number[]
    }) => {
      const res = await api.post('/deposits', {
        ...data,
        type: 'credit',
      })
      return res.data
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(res?.message || 'Deposit recorded successfully!')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
