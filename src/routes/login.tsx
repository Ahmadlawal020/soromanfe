import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '#/modules/auth'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return

    const stored = sessionStorage.getItem('dashboard-auth-storage')
    if (!stored) return

    let isAuthenticated = false
    try {
      const parsed = JSON.parse(stored)
      if (parsed?.state?.accessToken) {
        isAuthenticated = true
      }
    } catch {
      // ignore JSON parse errors
    }

    if (isAuthenticated) {
      throw redirect({ to: '/overview' })
    }
  },
  component: LoginForm,
})

