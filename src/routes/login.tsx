import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '#/modules/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem('dashboard-auth-storage')
    if (!stored) return

    try {
      const parsed = JSON.parse(stored)
      if (parsed?.state?.accessToken) {
        throw redirect({ to: '/overview' })
      }
    } catch (e) {
      // Re-throw TanStack redirect objects; ignore JSON parse errors
      if (e && typeof e === 'object' && '__isRedirect' in e) throw e
    }
  },
  component: LoginForm,
})
