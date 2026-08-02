import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'

export function useLpgOrderRequests(params?: { search?: string; status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['lpg-order-requests', params],
    queryFn: async () => {
      const res = await api.get('/lpg-order-requests', { params })
      return res.data.data
    },
  })
}

export function useLpgOrderRequestDetails(id: string | number) {
  return useQuery({
    queryKey: ['lpg-order-requests', id],
    queryFn: async () => {
      const res = await api.get(`/lpg-order-requests/${id}`)
      return res.data.data.request
    },
    enabled: !!id,
  })
}

export function useCreateLpgOrderRequest() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.post('/lpg-order-requests', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpg-order-requests'] })
      toast.success('LPG cooking gas order request submitted successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useReviewLpgOrderRequest() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, data }: { id: number; data: Record<string, any> }) => {
      const res = await api.put(`/lpg-order-requests/${id}/review`, data)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lpg-order-requests'] })
      toast.success(data?.message || 'Order request reviewed successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateLpgOrderPaymentStatus() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, paymentStatus }: { id: number; paymentStatus: string }) => {
      const res = await api.put(`/lpg-order-requests/${id}/payment-status`, { paymentStatus })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lpg-order-requests'] })
      toast.success(data?.message || 'Payment status updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateLpgOrderCollectionStatus() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, collectionStatus }: { id: number; collectionStatus: string }) => {
      const res = await api.put(`/lpg-order-requests/${id}/collection-status`, { collectionStatus })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lpg-order-requests'] })
      toast.success(data?.message || 'Collection status updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function usePayableLpgOrders() {
  return useQuery({
    queryKey: ['lpg-order-requests', 'payable'],
    queryFn: async () => {
      const res = await api.get('/lpg-order-requests/payable')
      return res.data.data.orders || []
    },
  })
}

export function usePayLpgOrder() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (orderId: number) => {
      const res = await api.put(`/lpg-order-requests/${orderId}/pay`)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'LPG order paid successfully')
      queryClient.invalidateQueries({ queryKey: ['lpg-order-requests'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
