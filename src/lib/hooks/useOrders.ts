import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'

export function useOrderList(params?: { page?: number; limit?: number; search?: string; status?: string; customer?: string; depot?: string | number; dateFrom?: string; dateTo?: string; refetchInterval?: number }) {
  const { refetchInterval, ...queryParams } = params || {}
  return useQuery({
    queryKey: ['orders', queryParams],
    queryFn: async () => {
      const res = await api.get('/orders', { params: queryParams })
      return res.data.data
    },
    refetchInterval: refetchInterval ?? false,
  })
}

export function useOrderDetails(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`)
      return res.data.data.order
    },
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.post('/orders', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['depots'] })
      queryClient.invalidateQueries({ queryKey: ['pfis'] })
      toast.success('Order created successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateOrder() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const res = await api.put(`/orders/${id}`, data)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Order updated successfully')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
