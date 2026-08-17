import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AdminUser {
  id: string
  email: string
  firstName: string
  surname: string
  roles: string[]
  canViewAllLocations?: boolean
  pageOverrides?: { routePath: string; allowed: boolean }[]
  profilePicture?: {
    url: string
    publicId: string
  }
}

interface AuthState {
  user: AdminUser | null
  accessToken: string | null
  csrfToken: string | null
  refreshToken: string | null
  setSession: (data: {
    user: AdminUser
    accessToken: string
    /** Legacy body transport. The server now sets an httpOnly cookie instead. */
    refreshToken?: string
    /** Double-submit value the refresh call echoes back as x-csrf-token. */
    csrfToken?: string
  }) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      csrfToken: null,
      refreshToken: null,

      setSession: (data) =>
        set({
          user: data.user,
          accessToken: data.accessToken,
          // Only overwrite when supplied — a refresh response that omits it
          // must not wipe the value obtained at login.
          ...(data.csrfToken ? { csrfToken: data.csrfToken } : {}),
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
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
