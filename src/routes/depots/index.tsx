import { useState, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Warehouse, User, Plus, Pencil } from 'lucide-react'

import { PageHeader } from '#/components/PageHeader'
import { FilterBar, FilterSearch, FilterClear } from '#/components/FilterBar'
import { StatCard, StatCardGrid } from '#/components/ui/stat-card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '#/components/ui/table'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { PANEL, MICRO } from '#/lib/panel'
import { cn, getErrorMessage } from '#/lib/utils'
import { useDepots } from '#/lib/hooks/useDepots'

export const Route = createFileRoute('/depots/')({
  component: DepotsDashboard,
})

export interface DepotItem {
  id: string; name: string; code: string; address: string; city: string; state: string; country: string; postcode: string; maxCapacity?: number; staffIds?: Array<{ _id: string; firstName: string; surname: string; otherNames?: string; email: string; profilePicture?: { url: string | null } }>; staff?: Array<{ id: string | number; adminId: string | number; firstName: string; surname: string; email: string; _id?: string }>; status: 'Active' | 'Maintenance' | 'High Capacity'; establishedYear: string; productCapacities?: Array<{ product: { _id: string; id?: string; name: string; sku: string; category: string }; capacity: number; availableStock?: number }>; productPrices?: Array<{ product: { _id: string; id?: string; name: string; sku: string; category: string }; currentPrice: number; priceHistory: Array<{ price: number; setAt: string }> }>;
  paystackSubaccountCode?: string;
  subaccountActive?: boolean;
  subaccountSplitPercentage?: number;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Active') return <Badge className="bg-success text-success-foreground">Active</Badge>
  if (status === 'High Capacity') return <Badge className="bg-warning text-warning-foreground">{status}</Badge>
  if (status === 'Maintenance') return <Badge variant="destructive">Maintenance</Badge>
  return <Badge variant="outline">{status}</Badge>
}

/** One line, in postal order, with the empty parts dropped. */
function addressOf(d: { address?: string; city?: string; state?: string; postcode?: string; country?: string }) {
  return [d.address, d.city, d.state, d.postcode, d.country].filter(Boolean).join(', ')
}

function DepotsDashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: depots = [], isLoading, isError, error, refetch } = useDepots()

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return depots
    return depots.filter((d) =>
      [d.name, d.code, addressOf(d)].some((v) => (v || '').toLowerCase().includes(q)),
    )
  }, [depots, search])

  const activeCount = depots.filter((d) => d.status === 'Active').length
  const staffCount = new Set(depots.flatMap((d) => (d.staff || []).map((s) => s.adminId))).size

  if (isLoading) return <PageLoader message="Loading depots…" />
  if (isError) return <PageError message={getErrorMessage(error)} onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Depots"
        description="Where product is stored and loaded from."
        actions={
          <Button onClick={() => navigate({ to: '/depots/form' })}>
            <Plus data-icon="inline-start" />
            New depot
          </Button>
        }
      />

      <StatCardGrid count={2}>
        <StatCard
          icon={<Warehouse />} label="Depots" value={depots.length}
          description={`${activeCount} active`}
        />
        <StatCard
          icon={<User />} label="Assigned staff" value={staffCount}
          description="Across every depot"
        />
      </StatCardGrid>

      <FilterBar>
        <FilterSearch value={search} onChange={setSearch} placeholder="Search name, code or address…" />
        {search && <FilterClear onClear={() => setSearch('')} />}
      </FilterBar>

      <section className={PANEL}>
        {rows.length === 0 ? (
          <PageEmpty
            icon={<Warehouse className="size-6 text-muted-foreground" />}
            title={search ? 'No depots match that search' : 'No depots yet'}
            description={search ? 'Try a different name, code or city.' : 'Create one to start receiving stock.'}
            actionLabel={search ? undefined : 'New depot'}
            onAction={search ? undefined : () => navigate({ to: '/depots/form' })}
            hasFilters={!!search}
            onClearFilters={() => setSearch('')}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Depot</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((depot) => (
                  <TableRow
                    key={depot.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: '/depots/details' as any, state: { depot } } as any)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{depot.name}</span>
                        {depot.code && (
                          <Badge variant="outline" className="font-mono text-xs">{depot.code}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md text-muted-foreground">
                      {addressOf(depot) || '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={depot.status} /></TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost" size="icon-sm" title="Edit depot"
                        onClick={() => navigate({ to: '/depots/form', state: { depot, isEdit: true } as any })}
                      >
                        <Pencil />
                        <span className="sr-only">Edit {depot.name}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {rows.length > 0 && (
          <p className={cn(MICRO, 'border-t border-foreground/10 p-3 text-muted-foreground')}>
            {rows.length} depot{rows.length === 1 ? '' : 's'}
          </p>
        )}
      </section>
    </div>
  )
}
