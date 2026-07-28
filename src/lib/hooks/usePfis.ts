import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'
import type { Pfi } from '#/lib/types'

export type { Pfi }

export function usePfiList(params?: { search?: string; status?: string; location?: string }) {
  return useQuery({
    queryKey: ['pfis', params],
    queryFn: async () => {
      const res = await api.get('/pfis', { params })
      return res.data.data
    },
  })
}

export function usePfiDetails(id: string) {
  return useQuery({
    queryKey: ['pfis', id],
    queryFn: async () => {
      const res = await api.get(`/pfis/${id}`)
      return res.data.data.pfi as Pfi
    },
    enabled: !!id,
  })
}

export function useCreatePfi() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.post('/pfis', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pfis'] })
      toast.success('PFI created successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdatePfi() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const res = await api.patch(`/pfis/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pfis'] })
      toast.success('PFI updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeletePfi() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (id: string) => {
      const res = await api.delete(`/pfis/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pfis'] })
      toast.success('PFI deleted successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDepotsForFilter() {
  return useQuery({
    queryKey: ['depots', 'filter'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await api.get('/depots')
      return (res.data.data.depots || []) as Array<{ _id: string; name: string }>
    },
  })
}
