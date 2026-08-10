import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/home/')({
  beforeLoad: () => routeGuard('/home'),
  component: () => (
    <ComingSoon
      eyebrow="Soroman"
      title="Home"
      description="Your starting point — what needs you today."
      planned={['Work waiting on your role', 'Recent activity', 'Shortcuts to your common tasks']}
    />
  ),
})
