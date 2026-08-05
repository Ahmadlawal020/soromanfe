import { createFileRoute, useRouterState } from '@tanstack/react-router'
import { UnifiedDeliveryCustomerForm } from '#/components/UnifiedDeliveryCustomerForm'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/filing-stations/form')({
  beforeLoad: () => routeGuard('/filing-stations'),
  validateSearch: (search: Record<string, unknown>) => ({
    customerId: (search.customerId as string) || '',
  }),
  component: FilingStationFormRoute,
})

function FilingStationFormRoute() {
  const searchParams = Route.useSearch()
  const routerState = useRouterState()
  const state = (routerState.location.state || {}) as { station?: any; customer?: any }
  const initialData = state.station || state.customer
  const customerId = searchParams.customerId || initialData?._id || initialData?.id

  return (
    <UnifiedDeliveryCustomerForm
      defaultCustomerType="filling_station"
      redirectPath="/filing-stations"
      customerId={customerId}
      initialCustomer={initialData}
    />
  )
}

