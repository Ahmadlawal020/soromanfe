import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/order-audit/')({
  beforeLoad: () => routeGuard('/order-audit'),
  component: () => (
    <ComingSoon
      eyebrow="Admin"
      title="Users log"
      description="Who did what, and when."
      planned={['Actions by user', 'Filter by entity and date', 'Export']}
    />
  ),
})
