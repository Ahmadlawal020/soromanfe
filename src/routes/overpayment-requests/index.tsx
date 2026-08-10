import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/overpayment-requests/')({
  beforeLoad: () => routeGuard('/overpayment-requests'),
  component: () => (
    <ComingSoon
      eyebrow="Finance"
      title="Transfer requests"
      description="Customer requests to move credit or withdraw it."
      planned={['Open requests', 'Approve or decline with a reason']}
    />
  ),
})
