import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/delivery-inventory/')({
  beforeLoad: () => routeGuard('/delivery-inventory'),
  component: () => (
    <ComingSoon
      eyebrow="Truck Sales"
      title="Delivery inventory"
      description="Stock held for truck sales."
      planned={['Inventory by product', 'Allocated versus available', 'Adjustments']}
    />
  ),
})
