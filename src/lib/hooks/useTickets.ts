import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'

export function useTicketList(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: async () => {
      const res = await api.get('/tickets', { params })
      return res.data.data
    },
  })
}

export function useTicketDetails(idOrCode: string) {
  return useQuery({
    queryKey: ['tickets', idOrCode],
    queryFn: async () => {
      const res = await api.get(`/tickets/${idOrCode}`)
      return res.data.data.ticket
    },
    enabled: !!idOrCode,
  })
}

export function useRedeemTicket() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (idOrCode: string) => {
      const res = await api.post(`/tickets/${idOrCode}/redeem`)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Ticket redeemed successfully')
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

// ─── Truck ticket generation ────────────────────────────────────────────────

export type TruckLoad = {
  id: number
  orderId: number
  truckIndex: number
  truckNumber: string
  quantity: string
  driverName: string | null
  driverPhone: string | null
  entryDriverName: string | null
  entryDriverPhone: string | null
  gantry: string | null
  loaderName: string | null
  status: 'pending' | 'gated_in' | 'loaded' | 'gated_out'
  securityEnteredAt: string | null
  loadedAt: string | null
  securityExitedAt: string | null
}

export type TruckDraft = {
  quantity: string
  driverName: string
  driverPhone: string
  truckNumber: string
}

/**
 * The order plus its truck loads — what the ticketing desk works from.
 *
 * The order detail endpoint does not embed loads, so they are fetched
 * alongside and merged into one object for the page.
 */
export function useOrderForTicketing(orderId?: number | string) {
  return useQuery({
    queryKey: ['orders', orderId, 'ticketing'],
    queryFn: async () => {
      const [order, loads] = await Promise.all([
        api.get(`/orders/${orderId}`),
        api.get(`/orders/${orderId}/trucks`),
      ])
      return {
        ...order.data.data.order,
        trucks: (loads.data.data.trucks || []) as TruckLoad[],
      } as any
    },
    enabled: Boolean(orderId),
  })
}

/**
 * Appends truck loads to a released order.
 *
 * The backend validates the whole batch under a row lock, so a rejection here
 * means nothing was written — the form can safely keep its state.
 */
export function useGenerateTickets() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    retry: false,
    mutationFn: async ({ orderId, trucks }: { orderId: number | string; trucks: TruckDraft[] }) => {
      const res = await api.post(`/orders/${orderId}/generate-tickets`, {
        trucks: trucks.map((t) => ({
          quantity: Number(t.quantity),
          driverName: t.driverName.trim(),
          driverPhone: t.driverPhone.trim(),
          truckNumber: t.truckNumber.trim(),
        })),
      })
      return res.data
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast.success(res?.message || 'Tickets generated')
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  })
}

/** Correct a load's own details after the fact — quantity, plate, driver. */
export function useUpdateTruckLoad() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    retry: false,
    mutationFn: async ({
      orderId, loadId, data,
    }: {
      orderId: number | string
      loadId: number
      data: Partial<{ quantity: number; truckNumber: string; driverName: string; driverPhone: string }>
    }) => {
      const res = await api.patch(`/orders/${orderId}/trucks/${loadId}`, data)
      return res.data
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['tickets'] })
      toast.success(res?.message || 'Truck details updated')
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  })
}

/** Flattened print payload for one truck. */
export function useTicketPrintData(orderId?: number | string, loadId?: number | null) {
  return useQuery({
    queryKey: ['orders', orderId, 'trucks', loadId, 'print'],
    queryFn: async () => {
      const res = await api.get(`/orders/${orderId}/trucks/${loadId}/print`)
      return res.data.data as Record<string, any>
    },
    enabled: Boolean(orderId && loadId),
  })
}
