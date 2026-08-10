import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/messaging/')({
  beforeLoad: () => routeGuard('/messaging'),
  component: () => (
    <ComingSoon
      eyebrow="Admin"
      title="Messaging"
      description="Send to customers and staff."
      planned={['Compose to a segment', 'Templates', 'Delivery log']}
    />
  ),
})
