import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/admin-reports/')({
  beforeLoad: () => routeGuard('/admin-reports'),
  component: () => (
    <ComingSoon
      eyebrow="Admin"
      title="Reports hub"
      description="Every report in one place."
      planned={['Browse by area', 'Run with a date range', 'Download']}
    />
  ),
})
