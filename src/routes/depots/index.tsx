import { useState } from 'react'
import { StatCard } from '#/components/ui/stat-card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Warehouse, User, Plus, Search, MapPin, Edit, Eye, X } from 'lucide-react'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'

export const Route = createFileRoute('/depots/')({
  component: DepotsDashboard,
})

export interface DepotItem {
  id: string; name: string; code: string; address: string; city: string; state: string; country: string; postcode: string; maxCapacity?: number; staffIds?: Array<{ _id: string; firstName: string; surname: string; otherNames?: string; email: string; profilePicture?: { url: string | null } }>; staff?: Array<{ id: string | number; adminId: string | number; firstName: string; surname: string; email: string; _id?: string }>; status: 'Active' | 'Maintenance' | 'High Capacity'; establishedYear: string; productCapacities?: Array<{ product: { _id: string; id?: string; name: string; sku: string; category: string }; capacity: number }>; productPrices?: Array<{ product: { _id: string; id?: string; name: string; sku: string; category: string }; currentPrice: number; priceHistory: Array<{ price: number; setAt: string }> }>
}

import { useDepots } from '#/lib/hooks/useDepots'

function getStatusBadge(status: string) {
  switch (status) {
    case 'Active': return <Badge className="bg-success text-success-foreground">{status}</Badge>
    case 'High Capacity': return <Badge className="bg-warning text-warning-foreground">{status}</Badge>
    case 'Maintenance': return <Badge variant="destructive">{status}</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function DepotsDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const { data: depots = [], isLoading, isError, error, refetch } = useDepots()

  const filteredDepots = depots.filter((depot) =>
    depot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (depot.code && depot.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (depot.city && depot.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (depot.state && depot.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (depot.country && depot.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (depot.staff || []).some((s) => `${s.firstName} ${s.surname}`.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const hasFilters = searchTerm.length > 0

  const statsCards = [
    { title: 'Total Depots', value: depots.length, sub: `${depots.filter((d) => d.status === 'Active').length} Active`, icon: Warehouse },
    { title: 'Assigned Staff', value: new Set(depots.flatMap((d) => (d.staff || []).map((s) => s.adminId))).size, sub: 'Across all depots', icon: User },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight text-balance">Depots & Hubs Management</h1>
          <p className="text-muted-foreground">Manage depots and organize regional cargo logistics.</p>
        </div>
        <Button size="sm"  onClick={() => navigate({ to: '/depots/form' })}><Plus className="size-4 mr-2" />Create New Depot</Button>
      </div>

      {!isLoading && !isError && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsCards.map((card) => (
          <StatCard key={card.title} icon={<card.icon />} label={card.title} value={card.value} description={card.sub} />
        ))}
      </div>
      )}

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><CardTitle>Depot Overview</CardTitle><CardDescription>Monitor and manage all depots</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input type="text" placeholder="Search depots or staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors duration-250 ease-luxe" aria-label="Clear search"><X className="size-2.5" /></button>}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full"><PageLoader message="Loading depots..." /></div>
            ) : isError ? (
              <div className="col-span-full"><PageError message={(error as any)?.message || 'Failed to load depots'} onRetry={() => refetch()} /></div>
            ) : filteredDepots.length === 0 ? (
              <div className="col-span-full">
                <PageEmpty
                  icon={<Warehouse className="size-6 text-muted-foreground" />}
                  title={hasFilters ? 'No depots match your search' : 'No depots yet'}
                  description={hasFilters ? 'Try adjusting your search criteria.' : 'Get started by creating your first depot.'}
                  actionLabel={hasFilters ? undefined : 'Create Depot'}
                  onAction={hasFilters ? undefined : () => navigate({ to: '/depots/form' })}
                  hasFilters={hasFilters}
                  onClearFilters={() => setSearchTerm('')}
 />
              </div>
            ) : (
              filteredDepots.map((depot) => {
                return (
                  <Card
                    key={depot.id}
                    className="card-hover cursor-pointer"
                    onClick={() => navigate({ to: '/depots/details' as any, state: { depot } } as any)}
 >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground">{depot.name}</h3>
                            <Badge variant="outline" className="font-mono text-xs">{depot.code}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{(depot.staff || []).map((s: any) => `${s.firstName} ${s.surname}`).join(', ') || 'No staff assigned'} &bull; Est. {depot.establishedYear}</p>
                        </div>
                        {getStatusBadge(depot.status)}
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-start gap-2"><MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" /><span className="text-xs text-muted-foreground line-clamp-2">{depot.address}, {depot.city}, {depot.state} {depot.postcode}, {depot.country}</span></div>
                      </div>
                      <div className="flex gap-2 pt-4 mt-4 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => { e.stopPropagation(); navigate({ to: '/depots/details' as any, state: { depot } } as any) }}
 >
                          <Eye className="size-4" /> View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => { e.stopPropagation(); navigate({ to: '/depots/form', state: { depot, isEdit: true } as any }) }}
 >
                          <Edit className="size-4" /> Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
