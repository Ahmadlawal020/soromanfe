import api from '#/lib/api/http.ts'

export interface CreateAdminPayload {
  first_name: string
  surname: string
  other_names?: string
  email: string
  phone_number?: string
  roles: number[]
  suspended?: boolean
}

export const createAdmin = async (payload: CreateAdminPayload) => {
  const res = await api.post('/admin', payload)
  return res.data
}

export const getAllAdmins = async () => {
  const res = await api.get('/admin')
  return res.data
}

export const getAdminById = async (id: string) => {
  const res = await api.get(`/admin/${id}`)
  return res.data
}

export const updateAdmin = async (id: string, payload: Partial<CreateAdminPayload>) => {
  const res = await api.patch(`/admin/${id}`, payload)
  return res.data
}

export const deleteAdmin = async (id: string) => {
  const res = await api.delete(`/admin/${id}`)
  return res.data
}

export const resendInvite = async (id: string) => {
  const res = await api.post(`/admin/${id}/resend-invite`)
  return res.data
}

export const setNewPassword = async (token: string, password: string) => {
  const res = await api.post('/auth/set-password', { token, password })
  return res.data
}
