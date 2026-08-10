import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/my-report/')({
  beforeLoad: () => routeGuard('/my-report'),
  component: () => (
    <ComingSoon
      eyebrow="My Reports"
      title="My report"
      description="What you personally handled, over a period you choose."
      planned={['Your actions by day', 'Volume and value you touched', 'Export']}
    />
  ),
})
