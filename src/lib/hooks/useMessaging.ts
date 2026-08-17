import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'

export interface SegmentCustomer {
  id: number
  name: string
  phone: string
  email: string
  companyName: string
}

export interface SegmentFilters {
  depotId?: number
  minOrders?: number
  sinceDays?: number
  inactiveSinceDays?: number
}

/** Resolves a messaging audience — "N customers match" plus the id list itself. */
export function useCustomerSegment(filters: SegmentFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['customer-segment', filters],
    queryFn: async () => {
      const res = await api.get('/customers/segments', { params: filters })
      return res.data.data as { customers: SegmentCustomer[]; count: number }
    },
    enabled: options?.enabled ?? true,
  })
}

export interface BroadcastPayload {
  title: string
  body: string
  audience: 'customers'
  customerIds: number[]
  channels: Array<'email' | 'sms'>
}

export interface BroadcastResult {
  recipients: number
  delivered: number
  duplicates: number
}

/** POST /notifications/broadcast, one call per <=1000 recipients — the schema's own cap. */
const BROADCAST_CHUNK_SIZE = 1000

export function useBroadcast() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (payload: BroadcastPayload) => {
      const chunks: number[][] = []
      for (let i = 0; i < payload.customerIds.length; i += BROADCAST_CHUNK_SIZE) {
        chunks.push(payload.customerIds.slice(i, i + BROADCAST_CHUNK_SIZE))
      }
      if (chunks.length === 0) chunks.push([])

      const totals: BroadcastResult = { recipients: 0, delivered: 0, duplicates: 0 }
      for (const customerIds of chunks) {
        const res = await api.post('/notifications/broadcast', {
          title: payload.title,
          body: payload.body,
          audience: payload.audience,
          customerIds,
          channels: payload.channels,
        })
        const data = res.data.data as BroadcastResult
        totals.recipients += data.recipients || 0
        totals.delivered += data.delivered || 0
        totals.duplicates += data.duplicates || 0
      }
      return totals
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['notification-deliveries'] })
      toast.success(`Sent to ${result.recipients} recipient(s)`)
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export interface NotificationDelivery {
  id: number
  customerId: number | null
  staffId: number | null
  type: string
  channel: 'in_app' | 'push' | 'email' | 'sms'
  destination: string
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'skipped' | 'suppressed'
  attempts: number
  error: string | null
  sentAt: string | null
  createdAt: string
}

export function useNotificationDeliveries(params?: { channel?: string; status?: string; type?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['notification-deliveries', params],
    queryFn: async () => {
      const res = await api.get('/notifications/deliveries', { params })
      return res.data.data as { data: NotificationDelivery[]; pagination: { total: number; page: number; limit: number; pages: number } }
    },
  })
}

export interface MessageTemplate {
  id: number
  name: string
  subject: string
  body: string
  channels: Array<'email' | 'sms'>
  createdBy: number | null
  createdAt: string
  updatedAt: string
}

export function useMessageTemplates() {
  return useQuery({
    queryKey: ['message-templates'],
    queryFn: async () => {
      const res = await api.get('/message-templates')
      return res.data.data.templates as MessageTemplate[]
    },
  })
}

export function useCreateMessageTemplate() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: { name: string; subject?: string; body: string; channels: Array<'email' | 'sms'> }) => {
      const res = await api.post('/message-templates', data)
      return res.data.data.template as MessageTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] })
      toast.success('Template saved')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeleteMessageTemplate() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (id: number) => {
      const res = await api.delete(`/message-templates/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] })
      toast.success('Template deleted')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
