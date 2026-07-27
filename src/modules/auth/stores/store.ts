import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AdminUser {
  id: string
  email: string
  firstName: string
  surname: string
  roles: string[]
  profilePicture?: {
    url: string
    publicId: string
  }
}

interface AuthState {
  user: AdminUser | null
  accessToken: string | null
  refreshToken: string | null
  setSession: (data: {
    user: AdminUser
    accessToken: string
    refreshToken: string
  }) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setSession: (data) =>
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        }),

      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: 'dashboard-auth-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
