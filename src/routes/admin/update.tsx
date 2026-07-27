import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/update')({
  beforeLoad: () => {
    throw redirect({ to: '/admin' })
  },
})
