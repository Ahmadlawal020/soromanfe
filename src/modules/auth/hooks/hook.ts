import { useMutation } from '@tanstack/react-query'
import { adminLogin, adminLogout, requestPasswordReset } from '../api/api'
import { useAuthStore } from '../stores/store'

export const useAdminLogin = () => {
  const setSession = useAuthStore((s) => s.setSession)

  return useMutation({
    mutationFn: adminLogin,
    onSuccess: (data) => {
      const payload = data?.data || data
      const user = payload?.user
      if (user) {
        setSession({
          user,
          accessToken: payload.accessToken || payload.token || '',
          refreshToken: payload.refreshToken || '',
        })
      }
    },
  })
}

export const useAdminLogout = () => {
  const clearSession = useAuthStore((s) => s.clearSession)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await adminLogout(refreshToken)
        } catch (error) {
          console.error(
            'Logout failed on server, clearing local session anyway.',
            error,
          )
        }
      }
      clearSession()
    },
    onSuccess: () => {
      clearSession()
    },
  })
}

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  })
}
