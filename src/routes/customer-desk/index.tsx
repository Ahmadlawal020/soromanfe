import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/customer-desk/')({
  beforeLoad: () => routeGuard('/customer-desk'),
  component: () => (
    <ComingSoon
      eyebrow="Orders"
      title="Customer desk"
      description="Raise and chase orders on a customer’s behalf."
      planned={['Look a customer up', 'Their open orders and balance', 'Place an order for them']}
    />
  ),
})
