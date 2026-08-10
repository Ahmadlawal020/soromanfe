import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/lpg/dashboard/')({
  beforeLoad: () => routeGuard('/lpg/dashboard'),
  component: () => (
    <ComingSoon
      eyebrow="LPG Division"
      title="LPG dashboard"
      description="Volumes, sales and stock across the division."
      planned={['Sales trend', 'Stock cover by plant']}
    />
  ),
})
