import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/product-manager-view/')({
  beforeLoad: () => routeGuard('/product-manager-view'),
  component: () => (
    <ComingSoon
      eyebrow="Orders"
      title="Location orders"
      description="The order register scoped to your location."
      planned={['Orders lifting from your depot', 'Stock pressure by product']}
    />
  ),
})
