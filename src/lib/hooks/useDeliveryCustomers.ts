import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { useAuthStore } from '#/modules/auth/stores/store'

export interface DeliveryCustomerPayload {
  _id?: string
  id?: string
  customerType: 'customer' | 'filling_station'
  customerCode?: string
  name?: string
  customer_name?: string
  phoneNumber?: string
  phone_number?: string
  altPhoneNumber?: string
  alt_phone_number?: string
  email?: string
  homeAddress?: string
  home_address?: string
  officeAddress?: string
  office_address?: string
  passportPhoto?: string
  passport_photo?: string
  contactPerson?: string
  contact_person?: string
  contactPersonPhone?: string
  contact_person_phone?: string
  stationAddress?: string
  station_address?: string
  tankCapacity?: number
  tank_capacity?: number
  pumpCount?: number
  pump_count?: number
  bankDetails?: {
    bankName?: string
    accountName?: string
    accountNumber?: string
  }
  bankName?: string
  bank_name?: string
  accountNumber?: string
  account_number?: string
  accountName?: string
  account_name?: string
  paystackCustomerId?: string
  virtualAccountNumber?: string
  virtualAccountBank?: string
  creditLimit?: number
  outstanding_limit?: number | string
  status?: 'active' | 'dormant' | 'suspended'
  notes?: string
}

function getErrorMessage(err: any): string {
  return err?.response?.data?.message || err?.message || 'An error occurred'
}

export function useDeliveryCustomerList(params?: { type?: string; search?: string; status?: string }) {
  const token = useAuthStore((s) => s.accessToken)

  const cleanParams = (() => {
    if (!params) return undefined
    const cleaned: Record<string, string> = {}
    if (params.type) cleaned.type = params.type
    if (params.search && params.search.trim()) cleaned.search = params.search.trim()
    if (params.status) cleaned.status = params.status
    return Object.keys(cleaned).length > 0 ? cleaned : undefined
  })()

  return useQuery({
    queryKey: ['delivery-customers', cleanParams],
    queryFn: async () => {
      const res = await api.get('/delivery-customers', { params: cleanParams })
      return res.data.data
    },
    enabled: typeof window !== 'undefined' && !!token,
  })
}

export function useDeliveryCustomerDetails(id?: string) {
  const token = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: ['delivery-customer-details', id],
    queryFn: async () => {
      const res = await api.get(`/delivery-customers/${id}`)
      return res.data.data
    },
    enabled: typeof window !== 'undefined' && !!token && !!id,
  })
}


export function useCreateDeliveryCustomer() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async (data: DeliveryCustomerPayload) => {
      const res = await api.post('/delivery-customers', data)
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-customers'] })
      queryClient.invalidateQueries({ queryKey: ['filing-stations'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success(
        `${variables.customerType === 'filling_station' ? 'Filling Station' : 'Delivery Customer'} created successfully`
      )
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateDeliveryCustomer() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DeliveryCustomerPayload> }) => {
      const res = await api.patch(`/delivery-customers/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-customers'] })
      toast.success('Delivery Customer updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeleteDeliveryCustomer() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/delivery-customers/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-customers'] })
      toast.success('Delivery Customer deleted successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
