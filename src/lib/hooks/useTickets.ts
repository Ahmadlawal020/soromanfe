import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'

export function useTicketList(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: async () => {
      const res = await api.get('/tickets', { params })
      return res.data.data
    },
  })
}

export function useTicketDetails(idOrCode: string) {
  return useQuery({
    queryKey: ['tickets', idOrCode],
    queryFn: async () => {
      const res = await api.get(`/tickets/${idOrCode}`)
      return res.data.data.ticket
    },
    enabled: !!idOrCode,
  })
}

export function useRedeemTicket() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (idOrCode: string) => {
      const res = await api.post(`/tickets/${idOrCode}/redeem`)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Ticket redeemed successfully')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
