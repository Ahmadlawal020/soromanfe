import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'
import type { StaffMember } from '#/routes/admin/-roles'

function mapAdminToStaffMember(admin: any): StaffMember {
  // administration_user.roles is Django's integer[] — Sman-Backend's
  // GET /admin and /admin/:id return it as-is (see staff.controller.js),
  // so no string translation happens or is needed here.
  const numericRoles = (admin.roles || []).map(Number).filter((r: number) => !isNaN(r));
  // Depots and LPG stations are both "location" scope from the user's point of
  // view; the StaffMember shape doesn't distinguish them, so they're merged.
  const depotIds: number[] = admin.depotIds || []
  const depotNames: string[] = admin.depotNames || []
  const lpgStationIds: number[] = admin.lpgStationIds || []
  const lpgStationNames: string[] = admin.lpgStationNames || []
  return {
    id: String(admin.id ?? admin._id),
    email: admin.email,
    full_name: `${admin.firstName || ''} ${admin.surname || ''} ${admin.otherNames || ''}`.trim().replace(/\s+/g, ' '),
    phone_number: admin.phoneNumber || null,
    username: admin.email,
    role: numericRoles.length > 0 ? numericRoles[0] : 1,
    roles: numericRoles,
    location: (depotNames[0] as any) || 'Headquarters',
    locations: [...depotIds, ...lpgStationIds],
    location_names: [...depotNames, ...lpgStationNames],
    pfis: admin.pfiIds || [],
    pfi_numbers: admin.pfiNumbers || [],
    can_view_all_locations: admin.canViewAllLocations ?? true,
    depot_ids: depotIds,
    lpg_station_ids: lpgStationIds,
    page_overrides: (admin.pageOverrides || []).map((o: any) => ({ route_path: o.routePath, allowed: o.allowed })),
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
