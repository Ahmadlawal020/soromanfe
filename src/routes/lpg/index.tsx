import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/lpg/')({
  beforeLoad: () => routeGuard('/lpg'),
  component: () => (
    <ComingSoon
      eyebrow="LPG Division"
      title="LPG division"
      description="The division at a glance."
      planned={['Plants, stock and sales in one view', 'Today’s movement']}
    />
  ),
})
