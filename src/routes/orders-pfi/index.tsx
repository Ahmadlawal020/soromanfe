import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/orders-pfi/')({
  beforeLoad: () => routeGuard('/orders-pfi'),
  component: () => (
    <ComingSoon
      eyebrow="Admin"
      title="Assign PFI"
      description="Attach orders to a cargo batch in bulk."
      planned={['Unassigned orders', 'Bulk assign to a PFI', 'Per-order result, not all-or-nothing']}
    />
  ),
})
