import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'

export function useDangoteProducts(params?: { search?: string; status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['dangote-products', params],
    queryFn: async () => {
      const res = await api.get('/dangote-products', { params })
      return res.data.data
    },
  })
}

export function useDangoteProductsActive() {
  return useQuery({
    queryKey: ['dangote-products-active'],
    queryFn: async () => {
      const res = await api.get('/products', { params: { productType: 'dangote', limit: 100 } })
      return res.data.data.products || []
    },
  })
}

export function useCreateDangoteProduct() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.post('/dangote-products', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dangote-products'] })
      toast.success('Dangote product created successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDangoteOrderRequests(params?: { search?: string; status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['dangote-order-requests', params],
    queryFn: async () => {
      const res = await api.get('/dangote-order-requests', { params })
      return res.data.data
    },
  })
}

export function useDangoteOrderRequestDetails(id: string | number) {
  return useQuery({
    queryKey: ['dangote-order-requests', id],
    queryFn: async () => {
      const res = await api.get(`/dangote-order-requests/${id}`)
      return res.data.data.request
    },
    enabled: !!id,
  })
}

export function useCreateDangoteOrderRequest() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.post('/dangote-order-requests', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dangote-order-requests'] })
      toast.success('Dangote delivery order request submitted successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useReviewDangoteOrderRequest() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, data }: { id: number; data: Record<string, any> }) => {
      const res = await api.put(`/dangote-order-requests/${id}/review`, data)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dangote-order-requests'] })
      toast.success(data?.message || 'Order request reviewed successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateDangoteOrderPaymentStatus() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, paymentStatus }: { id: number; paymentStatus: string }) => {
      const res = await api.put(`/dangote-order-requests/${id}/payment-status`, { paymentStatus })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dangote-order-requests'] })
      toast.success(data?.message || 'Payment status updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateDangoteOrderCollectionStatus() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, collectionStatus }: { id: number; collectionStatus: string }) => {
      const res = await api.put(`/dangote-order-requests/${id}/collection-status`, { collectionStatus })
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dangote-order-requests'] })
      toast.success(data?.message || 'Collection status updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
