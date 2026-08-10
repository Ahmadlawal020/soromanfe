import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/lpg/stock/')({
  beforeLoad: () => routeGuard('/lpg/stock'),
  component: () => (
    <ComingSoon
      eyebrow="LPG Division"
      title="LPG stock register"
      description="What is in tank, and what moved."
      planned={['Opening and closing stock', 'Receipts and issues', 'Variance']}
    />
  ),
})
