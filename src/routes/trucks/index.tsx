import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Truck, Search, Plus, Compass, Wrench, Fuel, User, X, SearchX, Loader2 } from 'lucide-react'
import { useTruckList } from '#/lib/hooks/useTrucks'

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

  const { data, isLoading } = useTruckList({ search: searchTerm || undefined, status: selectedStatus !== 'all' ? selectedStatus : undefined })
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trucks Fleet Management</h1>
          <p className="text-muted-foreground">Monitor and coordinate heavy duty vehicles, assignments, and locations.</p>
        </div>
        <Button size="sm" className="gradient-primary text-white border-0" onClick={() => navigate({ to: '/trucks/form' })}><Plus className="w-4 h-4 mr-2" />Register New Truck</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stats-card"><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">Total Trucks</p><p className="text-2xl font-bold">{stats.total}</p></div><Truck className="w-8 h-8 text-primary" /></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">In Transit</p><p className="text-2xl font-bold text-success">{stats.inTransit}</p></div><Compass className="w-8 h-8 text-success" /></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">Idle Fleet</p><p className="text-2xl font-bold text-warning">{stats.idle}</p></div><Fuel className="w-8 h-8 text-warning" /></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">In Maintenance</p><p className="text-2xl font-bold text-destructive">{stats.maintenance}</p></div><Wrench className="w-8 h-8 text-destructive" /></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><CardTitle>Fleet Directory</CardTitle><CardDescription>Browse vehicle status, assigned operators, and fuel metrics</CardDescription></div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input type="text" placeholder="Search plate, model, driver..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors" aria-label="Clear search"><X size={10} /></button>}
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
            <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
          ) : trucks.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-border mb-4"><SearchX size={24} className="text-muted-foreground" /></div>
              <p className="text-sm font-medium text-foreground">No trucks found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter criteria.</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedStatus('all') }} className="mt-4 text-primary"><X size={14} /> Clear filters</Button>
            </div>
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
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium"><Truck size={18} /></div>
                            <div><p className="font-medium">{truck.plateNumber}</p><p className="text-xs text-muted-foreground">{truck.make || ''} {truck.model}</p></div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{truck.capacity}</TableCell>
                        <TableCell><div className="flex items-center gap-1.5"><User size={14} className="text-muted-foreground" />{truck.driverName || 'Unassigned'}</div></TableCell>
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

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows per page:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(val) => {
                      setPageSize(Number(val))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={pageSize.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground ml-4">
                    Showing {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                    {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                  </p>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
                        return (
                          <div key={p} className="flex items-center">
                            {showEllipsis && <span className="px-2 text-xs text-muted-foreground">...</span>}
                            <Button
                              variant={currentPage === p ? 'default' : 'outline'}
                              size="sm"
                              className={`h-8 w-8 p-0 ${currentPage === p ? 'gradient-primary text-white border-0' : ''}`}
                              onClick={() => setCurrentPage(p)}
                            >
                              {p}
                            </Button>
                          </div>
                        )
                      })}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
