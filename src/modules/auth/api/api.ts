import api from '#/lib/api/http.ts'

export const adminLogin = async (payload: {
  email: string
  password: string
}) => {
  const res = await api.post('/auth/login', payload)
  return res.data
}

export const adminLogout = async (refreshToken: string) => {
  const res = await api.post('/auth/logout', { refreshToken })
  return res.data
}

export const adminRefresh = async (refreshToken: string) => {
  const res = await api.post('/auth/refresh', { refreshToken })
  return res.data
}

export const getMe = async () => {
  const res = await api.get('/auth/me')
  return res.data
}

export const requestPasswordReset = async (email: string) => {
  const res = await api.post('/auth/forgot-password', { email })
  return res.data
}
