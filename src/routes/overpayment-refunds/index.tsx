import { createFileRoute } from '@tanstack/react-router'

import { ComingSoon } from '#/components/ComingSoon'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/overpayment-refunds/')({
  beforeLoad: () => routeGuard('/overpayment-refunds'),
  component: () => (
    <ComingSoon
      eyebrow="Finance"
      title="Overpayment refunds"
      description="Money to send back where a customer paid too much."
      planned={['Accounts in credit', 'Raise a refund', 'Refund history']}
    />
  ),
})
