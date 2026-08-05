import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { UnifiedDeliveryCustomerForm } from '#/components/UnifiedDeliveryCustomerForm'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/delivery-customer/form')({
  beforeLoad: () => routeGuard('/delivery-customer'),
  validateSearch: (search: Record<string, unknown>) => ({
    customerId: (search.customerId as string) || '',
  }),
  component: DeliveryCustomerFormRoute,
})

function DeliveryCustomerFormRoute() {
  const searchParams = Route.useSearch()
  const routerState = useRouterState()
  const state = (routerState.location.state || {}) as { customer?: any }
  const customerId = searchParams.customerId || state.customer?._id || state.customer?.id

  return (
    <UnifiedDeliveryCustomerForm
      defaultCustomerType="customer"
      redirectPath="/delivery-customer"
      customerId={customerId}
      initialCustomer={state.customer}
    />
  )
}

