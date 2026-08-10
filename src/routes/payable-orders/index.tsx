import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Payable Orders is now a filter on the order register, not its own page.
 *
 * Having a second screen showing a subset of the same rows meant guessing
 * which page an order was on, and the two could disagree. The rule is
 * unchanged — unpaid, pending, and the customer's wallet already covers it.
 *
 * The route is kept so existing links, bookmarks and the command palette
 * still land somewhere sensible.
 */
export const Route = createFileRoute('/payable-orders/')({
  beforeLoad: () => {
    throw redirect({ to: '/orders', search: { payable: '1' } as never })
  },
})
