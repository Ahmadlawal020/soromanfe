import { createFileRoute } from '@tanstack/react-router'
import { SalesLedgerDetails } from '#/components/sales-ledger/details'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/sales-ledger/details')({
  beforeLoad: () => routeGuard('/sales-ledger'),
  validateSearch: (search: Record<string, unknown>): {
    key?: string
    loadingId?: string
    truckNumber?: string
    dateLoaded?: string
    customerId?: string
    code?: string
  } => ({
    key: (search.key as string) || undefined,
    loadingId: (search.loadingId as string) || undefined,
    truckNumber: (search.truckNumber as string) || undefined,
    dateLoaded: (search.dateLoaded as string) || undefined,
    customerId: (search.customerId as string) || undefined,
    code: (search.code as string) || undefined,
  }),
  component: SalesLedgerDetails,
})
