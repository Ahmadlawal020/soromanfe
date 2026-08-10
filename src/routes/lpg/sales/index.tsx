import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/lpg/sales/')({
  beforeLoad: () => routeGuard('/lpg/sales'),
  component: () => (
    <ComingSoon
      eyebrow="LPG Division"
      title="LPG sales register"
      description="Sales recorded across the division."
      planned={['Sales by plant and day', 'Cash reconciliation', 'Export']}
    />
  ),
})
