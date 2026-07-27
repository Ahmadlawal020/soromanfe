import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { UnifiedDeliveryCustomerForm } from '#/components/UnifiedDeliveryCustomerForm'

export const Route = createFileRoute('/delivery-customer/form')({
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

