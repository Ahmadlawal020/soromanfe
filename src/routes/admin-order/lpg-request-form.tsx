import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/admin-order/lpg-request-form')({
  beforeLoad: () => {
    throw redirect({ to: '/admin-order' })
  },
})
