import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/feedback-dashboard/')({
  beforeLoad: () => routeGuard('/feedback-dashboard'),
  component: () => (
    <ComingSoon
      eyebrow="Feedback"
      title="Feedback & reviews"
      description="What customers are telling you."
      planned={['Reviews and ratings', 'Themes over time', 'Respond']}
    />
  ),
})
