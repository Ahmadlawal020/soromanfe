import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'

export function useCustomerList(
  params?: { search?: string; searchType?: string; status?: string; page?: number; limit?: number; refetchInterval?: number },
  options?: { enabled?: boolean }
) {
  const { refetchInterval, ...queryParams } = params || {}
  return useQuery({
    queryKey: ['customers', queryParams],
    queryFn: async () => {
      const res = await api.get('/customers', { params: queryParams })
      return res.data.data
    },
    refetchInterval: refetchInterval ?? false,
    ...options,
  })
}

export function useCustomerDetails(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const res = await api.get(`/customers/${id}`)
      return res.data.data.customer
    },
    enabled: !!id,
  })
}

function getErrorMessage(err: any): string {
  return err?.response?.data?.message || err?.message || 'An unexpected error occurred'
}

export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.post('/customers', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer created successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const res = await api.patch(`/customers/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/customers/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deleted successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
