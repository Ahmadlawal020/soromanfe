import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/inventory/')({
  beforeLoad: () => routeGuard('/inventory'),
  component: () => (
    <ComingSoon
      eyebrow="Admin"
      title="Stock management"
      description="Stock across depots and products."
      planned={['Stock on hand', 'Movements', 'Reorder pressure']}
    />
  ),
})
