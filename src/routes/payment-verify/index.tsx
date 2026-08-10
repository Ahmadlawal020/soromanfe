import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/payment-verify/')({
  beforeLoad: () => routeGuard('/payment-verify'),
  component: () => (
    <ComingSoon
      eyebrow="Finance"
      title="Verify payments"
      description="Confirm incoming payments against orders."
      planned={['Unverified payments queue', 'Match to an order', 'Confirm or query']}
    />
  ),
})
