import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'
import type { CustomerLicense } from '#/lib/types'

export function useCustomerLicenses(customerId: string | number | undefined) {
  return useQuery({
    queryKey: ['customer-licenses', customerId],
    queryFn: async () => {
      const res = await api.get(`/customer-licenses/customer/${customerId}`)
      return res.data.data.licenses as CustomerLicense[]
    },
    enabled: !!customerId,
  })
}

export function useAllLicenses(filters: {
  status?: string
  search?: string
  page?: number
  limit?: number
} = {}) {
  return useQuery({
    queryKey: ['all-licenses', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.search) params.set('search', filters.search)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit))
      const res = await api.get(`/customer-licenses?${params.toString()}`)
      return res.data.data as {
        licenses: (CustomerLicense & { customerName?: string })[]
        pagination: { total: number; page: number; pages: number }
      }
    },
  })
}

export function useLicenseDetails(id: string | number | undefined) {
  return useQuery({
    queryKey: ['license-details', id],
    queryFn: async () => {
      const res = await api.get(`/customer-licenses/${id}`)
      return res.data.data.license as CustomerLicense
    },
    enabled: !!id,
  })
}

export function useCreateCustomerLicense() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: {
      customerId: number
      companyName: string
      licenseUrl?: string
      licensePublicId?: string
      expiryDate?: string
    }) => {
      const res = await api.post('/customer-licenses', data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customer-licenses', variables.customerId],
      })
      queryClient.invalidateQueries({ queryKey: ['all-licenses'] })
      toast.success('License added successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateCustomerLicense() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({
      id,
      data,
      customerId: _customerId,
    }: {
      id: number
      data: {
        companyName?: string
        licenseUrl?: string
        licensePublicId?: string
        expiryDate?: string
      }
      customerId: number
    }) => {
      const res = await api.patch(`/customer-licenses/${id}`, data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customer-licenses', variables.customerId],
      })
      queryClient.invalidateQueries({ queryKey: ['all-licenses'] })
      toast.success('License updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeleteCustomerLicense() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({
      id,
      customerId: _customerId,
    }: {
      id: number
      customerId: number
    }) => {
      const res = await api.delete(`/customer-licenses/${id}`)
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customer-licenses', variables.customerId],
      })
      queryClient.invalidateQueries({ queryKey: ['all-licenses'] })
      toast.success('License deleted successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useReviewLicense() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({
      id,
      approve,
      comment,
    }: {
      id: number
      approve: boolean
      comment?: string
    }) => {
      const res = await api.post(`/customer-licenses/${id}/review`, {
        approve,
        comment: comment || '',
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['all-licenses'] })
      queryClient.invalidateQueries({ queryKey: ['customer-licenses'] })
      toast.success(
        variables.approve ? 'License approved' : 'License rejected'
      )
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
