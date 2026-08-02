import { useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { StatCard } from '#/components/ui/stat-card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Flame, User, Plus, Search, MapPin, Edit, Eye, X, FileText, Layers } from 'lucide-react'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import type { LpgStationItem } from '#/lib/hooks/useLpgStations'
import { useLpgStations } from '#/lib/hooks/useLpgStations'

export const Route = createFileRoute('/lpg-stations/')({
  component: LpgStationsDashboard,
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'Active': return <Badge className="bg-success text-success-foreground">{status}</Badge>
    case 'High Capacity': return <Badge className="bg-warning text-warning-foreground">{status}</Badge>
    case 'Maintenance': return <Badge variant="destructive">{status}</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function LpgStationsDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const { data: stations = [], isLoading, isError, error, refetch } = useLpgStations()

  const filteredStations = stations.filter((station) =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (station.code && station.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (station.city && station.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (station.state && station.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (station.country && station.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (station.staff || []).some((s) => `${s.firstName} ${s.surname}`.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const hasFilters = searchTerm.length > 0

  const totalCapacityKg = stations.reduce((sum, s) => sum + (s.lpgCapacityKg || 0), 0)
  const totalPfis = stations.reduce((sum, s) => sum + (s.pfis?.length || 0), 0)
  const totalCylinders = stations.reduce((sum, s) => sum + (s.cylinders || []).reduce((s2: number, c: any) => s2 + (Number(c.quantity) || 0), 0), 0)

  const statsCards = [
    { title: 'Total LPG Stations', value: stations.length, sub: `${stations.filter((s) => s.status === 'Active').length} Active`, icon: Flame },
    { title: 'Total LPG Capacity', value: `${totalCapacityKg.toLocaleString()} Kg`, sub: 'Across all stations', icon: FileText },
    { title: 'Total Cylinders', value: totalCylinders.toLocaleString(), sub: 'Across all stations', icon: Layers },
    { title: 'Assigned Staff', value: new Set(stations.flatMap((s) => (s.staff || []).map((st) => st.adminId))).size, sub: 'Across all stations', icon: User },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
      eyebrow="LPG Home Delivery"
      title="LPG Stations Management"
      description="Manage LPG stations for home delivery operations."
      actions={
        <>
          <Button size="sm" onClick={() => navigate({ to: '/lpg-stations/form' })}><Plus className="size-4 mr-2" />Create New Station</Button>
        </>
      }
    />

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((card) => (
            <StatCard key={card.title} icon={<card.icon />} label={card.title} value={card.value} description={card.sub} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><CardTitle>LPG Station Overview</CardTitle><CardDescription>Monitor and manage all LPG stations</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input type="text" placeholder="Search stations or staff..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors duration-250 ease-luxe" aria-label="Clear search"><X className="size-2.5" /></button>}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full"><PageLoader message="Loading LPG stations..." /></div>
            ) : isError ? (
              <div className="col-span-full"><PageError message={(error as any)?.message || 'Failed to load LPG stations'} onRetry={() => refetch()} /></div>
            ) : filteredStations.length === 0 ? (
              <div className="col-span-full">
                <PageEmpty
                  icon={<Flame className="size-6 text-muted-foreground" />}
                  title={hasFilters ? 'No stations match your search' : 'No LPG stations yet'}
                  description={hasFilters ? 'Try adjusting your search criteria.' : 'Get started by creating your first LPG station.'}
                  actionLabel={hasFilters ? undefined : 'Create LPG Station'}
                  onAction={hasFilters ? undefined : () => navigate({ to: '/lpg-stations/form' })}
                  hasFilters={hasFilters}
                  onClearFilters={() => setSearchTerm('')}
                />
              </div>
            ) : (
              filteredStations.map((station) => {
                return (
                  <Card
                    key={station.id}
                    className="card-hover cursor-pointer"
                    onClick={() => navigate({ to: '/lpg-stations/details' as any, state: { station } } as any)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-semibold text-foreground">{station.name}</h3>
                            <Badge variant="outline" className="font-mono text-xs">{station.code}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{(station.staff || []).map((s: any) => `${s.firstName} ${s.surname}`).join(', ') || 'No staff assigned'} &bull; Est. {station.establishedYear}</p>
                        </div>
                        {getStatusBadge(station.status)}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2"><MapPin className="size-4 text-muted-foreground shrink-0 mt-0.5" /><span className="text-xs text-muted-foreground line-clamp-2">{station.address}, {station.city}, {station.state} {station.postcode}, {station.country}</span></div>
                        <div className="flex items-center gap-2"><Flame className="size-4 text-primary shrink-0" /><span className="text-xs font-normal text-foreground">{station.lpgCapacityKg?.toLocaleString()} Kg Capacity</span></div>
                        <div className="flex items-center gap-2"><Layers className="size-4 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">{(station.cylinders || []).reduce((sum: number, c: any) => sum + (Number(c.quantity) || 0), 0).toLocaleString()} Cylinders ({(station.cylinders || []).length} sizes)</span></div>
                      </div>
                      <div className="flex gap-2 pt-4 mt-4 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => { e.stopPropagation(); navigate({ to: '/lpg-stations/details' as any, state: { station } } as any) }}
                        >
                          <Eye className="size-4" /> View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => { e.stopPropagation(); navigate({ to: '/lpg-stations/form', state: { station, isEdit: true } as any }) }}
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
