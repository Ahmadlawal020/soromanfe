import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/lpg/plants/')({
  beforeLoad: () => routeGuard('/lpg/plants'),
  component: () => (
    <ComingSoon
      eyebrow="LPG Division"
      title="LPG plants"
      description="The plants themselves."
      planned={['Plant register', 'Capacity and staffing', 'Status']}
    />
  ),
})
