import { useQuery } from '@tanstack/react-query'
import api from '#/lib/api/http'
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
