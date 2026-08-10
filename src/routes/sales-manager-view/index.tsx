import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/sales-manager-view/')({
  beforeLoad: () => routeGuard('/sales-manager-view'),
  component: () => (
    <ComingSoon
      eyebrow="Orders"
      title="Marketing orders"
      description="The order register scoped to marketing."
      planned={['Orders for your accounts', 'Conversion and volume by customer']}
    />
  ),
})
