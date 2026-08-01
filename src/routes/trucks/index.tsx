import { useState, useEffect } from 'react'
import { StatCard } from '#/components/ui/stat-card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Truck, Search, Plus, Compass, Wrench, Fuel, User, X } from 'lucide-react'
import { useTruckList } from '#/lib/hooks/useTrucks'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { Pagination } from '#/components/Pagination'

export const Route = createFileRoute('/trucks/')({
  component: TrucksDashboard,
})

function getFuelColor(level: number) {
  if (level > 50) return 'bg-success'
  if (level > 20) return 'bg-warning'
  return 'bg-destructive'
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'In Transit': return <Badge className="bg-success text-success-foreground">{status}</Badge>
    case 'Idle': return <Badge className="bg-warning text-warning-foreground">{status}</Badge>
    case 'Maintenance': return <Badge variant="destructive">{status}</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function TrucksDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isError, error, refetch } = useTruckList({ search: searchTerm || undefined, status: selectedStatus !== 'all' ? selectedStatus : undefined })
  const trucks = data?.trucks || []

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStatus])

  const totalItems = trucks.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedTrucks = trucks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )
  const stats = {
    total: data?.pagination?.total || 0,
    inTransit: trucks.filter((t: any) => t.status === 'In Transit').length,
    idle: trucks.filter((t: any) => t.status === 'Idle').length,
    maintenance: trucks.filter((t: any) => t.status === 'Maintenance').length,
  }

  const hasFilters = Boolean(searchTerm || selectedStatus !== 'all')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight text-balance">Trucks Fleet Management</h1>
          <p className="text-muted-foreground">Monitor and coordinate heavy duty vehicles, assignments, and locations.</p>
        </div>
        <Button size="sm"  onClick={() => navigate({ to: '/trucks/form' })}><Plus className="size-4 mr-2" />Register New Truck</Button>
      </div>

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Truck />} label="Total Trucks" value={stats.total} />
          <StatCard icon={<Compass />} label="In Transit" value={stats.inTransit} />
          <StatCard tone="amber" icon={<Fuel />} label="Idle Fleet" value={stats.idle} />
          <StatCard tone="red" icon={<Wrench />} label="In Maintenance" value={stats.maintenance} />
        </div>
      )}

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><CardTitle>Fleet Directory</CardTitle><CardDescription>Browse vehicle status, assigned operators, and fuel metrics</CardDescription></div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input type="text" placeholder="Search plate, model, driver..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors duration-250 ease-luxe" aria-label="Clear search"><X className="size-2.5" /></button>}
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Idle">Idle</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoader message="Loading trucks..." />
          ) : isError ? (
            <PageError message={(error as any)?.message || 'Failed to load trucks'} onRetry={() => refetch()} />
          ) : trucks.length === 0 ? (
            <PageEmpty
              icon={<Truck className="size-6 text-muted-foreground" />}
              title={hasFilters ? 'No trucks match your filters' : 'No trucks yet'}
              description={hasFilters ? 'Try adjusting your search or filter criteria.' : 'Get started by registering your first truck.'}
              actionLabel={hasFilters ? undefined : 'Register Truck'}
              onAction={hasFilters ? undefined : () => navigate({ to: '/trucks/form' })}
              hasFilters={hasFilters}
              onClearFilters={() => { setSearchTerm(''); setSelectedStatus('all') }}
 />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Truck Detail</TableHead><TableHead>Capacity</TableHead><TableHead>Current Operator</TableHead><TableHead>Fuel Level</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {paginatedTrucks.map((truck: any) => (
                      <TableRow key={truck._id} className="cursor-pointer hover:bg-muted transition" onClick={() => navigate({ to: '/trucks/details' as any, search: { id: truck._id || truck.id } as any, state: { truck } } as any)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium"><Truck className="size-4" /></div>
                            <div><p className="font-medium">{truck.plateNumber}</p><p className="text-xs text-muted-foreground">{truck.make || ''} {truck.model}</p></div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{truck.capacity}</TableCell>
                        <TableCell><div className="flex items-center gap-1.5"><User className="size-3.5 text-muted-foreground" />{truck.driverName || 'Unassigned'}</div></TableCell>
                        <TableCell>
                          <div className="w-full max-w-[100px] flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden min-w-[48px]"><div className={`h-full rounded-full ${getFuelColor(truck.fuelLevel)}`} style={{ width: `${truck.fuelLevel}%` }} /></div>
                            <span className="text-xs font-semibold tabular-nums">{truck.fuelLevel}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(truck.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
 />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
