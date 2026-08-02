import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'
import type { LpgStation, LpgStationItem } from '#/lib/types'

export type { LpgStation, LpgStationItem }

export function useLpgStations(params?: { search?: string, page?: number, limit?: number }) {
  return useQuery({
    queryKey: ['lpg-stations', params],
    queryFn: async () => {
      const res = await api.get('/lpg-stations', { params })
      return (res.data.data.stations || []) as LpgStationItem[]
    },
  })
}

export function useLpgStationDetails(id: string) {
  return useQuery({
    queryKey: ['lpg-stations', id],
    queryFn: async () => {
      const res = await api.get(`/lpg-stations/${id}`)
      return res.data.data.station as LpgStation
    },
    enabled: !!id,
  })
}

export function useCreateLpgStation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.post('/lpg-stations', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpg-stations'] })
      toast.success('LPG station created successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateLpgStation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const res = await api.patch(`/lpg-stations/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpg-stations'] })
      toast.success('LPG station updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeleteLpgStation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (id: string) => {
      const res = await api.delete(`/lpg-stations/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lpg-stations'] })
      toast.success('LPG station deleted successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
