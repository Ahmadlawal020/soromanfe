import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/confirmed-payments/')({
  beforeLoad: () => routeGuard('/confirmed-payments'),
  component: () => (
    <ComingSoon
      eyebrow="Finance"
      title="Finance report"
      description="Confirmed payments over a period."
      planned={['Confirmed payments with split rows', 'Totals by bank and method', 'Export']}
    />
  ),
})
