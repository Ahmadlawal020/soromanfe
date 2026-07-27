import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'

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

function getErrorMessage(err: any): string {
  return err?.response?.data?.message || err?.message || 'An unexpected error occurred'
}

export function useRedeemTicket() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
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
