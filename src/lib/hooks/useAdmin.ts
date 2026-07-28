import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'
import type { StaffMember } from '#/routes/admin/-roles'

const ROLE_MAP_REVERSE: Record<string, number> = {
  super_admin: 0,
  admin: 1,
  finance: 2,
  truck_sales: 3,
  ticketing: 4,
  security: 5,
  transport: 6,
  release: 7,
  audit: 8,
  sales_manager: 9,
  product_manager: 10,
  lpg_dashboard: 11,
  lpg_plants: 12,
  lpg_stock: 13,
  lpg_sales: 14,
  commissions: 15,
  commission_officer: 16,
  dispatch: 17,
  it_compliance: 18,
};

function mapAdminToStaffMember(admin: any): StaffMember {
  const numericRoles = (admin.roles || []).map((r: string) => ROLE_MAP_REVERSE[r]).filter((r: number | undefined) => r !== undefined);
  return {
    id: String(admin.id ?? admin._id),
    email: admin.email,
    full_name: `${admin.firstName || ''} ${admin.surname || ''} ${admin.otherNames || ''}`.trim().replace(/\s+/g, ' '),
    phone_number: admin.phoneNumber || null,
    username: admin.email,
    role: numericRoles.length > 0 ? numericRoles[0] : 1,
    roles: numericRoles,
    location: 'Headquarters',
    locations: [],
    location_names: [],
    pfis: [],
    pfi_numbers: [],
    can_view_all_locations: true,
    suspended: admin.suspended || false,
    email_verified: admin.isPasswordSet || false,
    plain_password: null,
    last_login: null,
    last_login_ip: null,
    date_joined: admin.createdAt || new Date().toISOString(),
    is_staff: true,
    is_superuser: numericRoles.includes(0),
  };
}

export function useAdminList(params?: { search?: string }) {
  return useQuery({
    queryKey: ['admins', params],
    queryFn: async () => {
      const res = await api.get('/admin', { params })
      return (res.data.data.admins || []).map(mapAdminToStaffMember) as StaffMember[]
    },
  })
}

export function useAdminDetails(id: string) {
  return useQuery({
    queryKey: ['admins', id],
    queryFn: async () => {
      const res = await api.get(`/admin/${id}`)
      return mapAdminToStaffMember(res.data.data.admin)
    },
    enabled: !!id,
  })
}

export function useCreateAdmin() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.post('/admin', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      toast.success('Admin created successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const res = await api.patch(`/admin/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      toast.success('Admin updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] })
      toast.success('Admin deleted successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}
