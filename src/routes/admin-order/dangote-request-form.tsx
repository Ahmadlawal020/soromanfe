import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * The Dangote request wizard now lives inline on /admin-order, selected with
 * the order type buttons rather than on its own page. Kept as a redirect so
 * existing links and bookmarks still land somewhere sensible.
 */
export const Route = createFileRoute('/admin-order/dangote-request-form')({
  beforeLoad: () => {
    throw redirect({ to: '/admin-order' })
  },
})
