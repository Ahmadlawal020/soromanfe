import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import type { FilingStation } from '#/lib/types'

function getErrorMessage(err: any): string {
  return err?.response?.data?.message || err?.message || 'An unexpected error occurred'
}

export function useFilingStations(params?: { search?: string, page?: number, limit?: number }) {
  return useQuery({
    queryKey: ['filing-stations', params],
    queryFn: async () => {
      const res = await api.get('/filing-stations', { params })
      return (res.data.data.stations || []) as FilingStation[]
    },
  })
}

export function useFilingStationDetails(id: string) {
  return useQuery({
    queryKey: ['filing-stations', id],
    queryFn: async () => {
      const res = await api.get(`/filing-stations/${id}`)
      return res.data.data.station as FilingStation
    },
    enabled: !!id,
  })
}

export function useCreateFilingStation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async (data: Partial<FilingStation>) => {
      const res = await api.post('/filing-stations', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filing-stations'] })
      toast.success('Filing station created successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateFilingStation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FilingStation> }) => {
      const res = await api.patch(`/filing-stations/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filing-stations'] })
      toast.success('Filing station updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeleteFilingStation() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/filing-stations/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filing-stations'] })
      toast.success('Filing station deleted successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}



