import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'
import type { Vendor, VendorSummary, VendorExpenseRow } from '#/lib/types'

export type { Vendor, VendorSummary, VendorExpenseRow }

export function useVendors(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: async () => {
      const res = await api.get('/vendors', { params })
      return (res.data?.data?.vendors || []) as Vendor[]
    },
  })
}

export function useVendorDetails(id: string | number) {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: async () => {
      const res = await api.get(`/vendors/${id}`)
      return res.data?.data as { vendor: Vendor; summary: VendorSummary; expenses: VendorExpenseRow[] }
    },
    enabled: !!id,
  })
}

export function useCreateVendor() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: Partial<Vendor>) => {
      const res = await api.post('/vendors', data)
      return res.data?.data?.vendor as Vendor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Vendor saved')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateVendor() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, data }: { id: string | number; data: Partial<Vendor> }) => {
      const res = await api.patch(`/vendors/${id}`, data)
      return res.data?.data?.vendor as Vendor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Vendor updated')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
