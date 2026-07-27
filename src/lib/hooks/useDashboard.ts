import { useQuery } from '@tanstack/react-query'
import api from '#/lib/api/http'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats')
      return res.data.data
    },
  })
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const res = await api.get('/dashboard/overview')
      return res.data.data
    },
  })
}
