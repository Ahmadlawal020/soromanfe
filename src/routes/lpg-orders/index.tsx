import { useState, useEffect } from 'react'
import { StatCard } from '#/components/ui/stat-card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { Package, Clock, CheckCircle, DollarSign, Search, Plus, X, Eye, FileText, MapPin, Truck, Flame } from 'lucide-react'
import { useLpgOrderRequests } from '#/lib/hooks/useLpgOrders'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { Pagination } from '#/components/Pagination'

export const Route = createFileRoute('/lpg-orders/')({
  component: LpgOrdersDashboard,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value)
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function paymentStatusBadge(status: string) {
  switch (status) {
    case 'Paid':
      return <Badge className="bg-accent/15 text-accent border-accent/20 gap-1"><CheckCircle className="size-3" /> Paid</Badge>
    case 'Unpaid':
      return <Badge className="bg-warning/15 text-warning border-warning/20 gap-1"><Clock className="size-3" /> Unpaid</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function collectionStatusBadge(status: string) {
  switch (status) {
    case 'Collected':
      return <Badge className="bg-accent/15 text-accent border-accent/20 gap-1"><CheckCircle className="size-3" /> Collected</Badge>
    case 'Dispatched':
      return <Badge className="bg-muted/15 text-muted-foreground border-border/20 gap-1"><Truck className="size-3" /> Dispatched</Badge>
    case 'Pending':
      return <Badge className="bg-warning/15 text-warning border-warning/20 gap-1"><Clock className="size-3" /> Pending</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function LpgOrdersDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [collectionFilter, setCollectionFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, paymentFilter, collectionFilter])

  const { data, isLoading, isError, error, refetch } = useLpgOrderRequests({
    search: debouncedSearch || undefined,
    status: 'Approved',
    limit: 100,
  })

  const requests = data?.requests || []
  const hasFilters = !!(debouncedSearch || paymentFilter !== 'all' || collectionFilter !== 'all')

  const filteredRequests = requests.filter((req: any) => {
    const matchesPayment = paymentFilter === 'all' || req.paymentStatus === paymentFilter
    const matchesCollection = collectionFilter === 'all' || req.collectionStatus === collectionFilter
    return matchesPayment && matchesCollection
  })

  const totalOrders = filteredRequests.length
  const paidOrders = filteredRequests.filter((r: any) => r.paymentStatus === 'Paid').length
  const unpaidOrders = filteredRequests.filter((r: any) => r.paymentStatus === 'Unpaid').length
  const totalValue = filteredRequests.reduce((sum: number, r: any) => sum + (Number(r.totalAmount) || 0), 0)

  const totalItems = filteredRequests.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (isLoading) {
    return <PageLoader message="Loading LPG cooking gas orders..." />
  }

  if (isError) {
    return <PageError message={(error as any)?.message || 'Failed to load orders'} onRetry={refetch} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight text-balance">LPG Cooking Gas Orders</h1>
          <p className="text-muted-foreground">View and track all LPG cooking gas orders, payment, and collection status.</p>
        </div>
        <Button size="sm" onClick={() => navigate({ to: '/admin-order' as any })}>
          <Plus data-icon="inline-start" />
          Place LPG order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileText />} label="Total Orders" value={totalOrders} />
        <StatCard icon={<CheckCircle />} label="Paid" value={paidOrders} />
        <StatCard tone="amber" icon={<Clock />} label="Unpaid" value={unpaidOrders} />
        <StatCard icon={<DollarSign />} label="Total Value" value={formatCurrency(totalValue)} />
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>LPG Order Register</CardTitle>
              <CardDescription>A complete log of all approved LPG cooking gas orders</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  type="text"
                  placeholder="Search request ID, customer, station..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors duration-250 ease-luxe"
                    aria-label="Clear search"
                  >
                    <X className="size-2.5" />
                  </button>
                )}
              </div>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payment</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
              <Select value={collectionFilter} onValueChange={setCollectionFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collection</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Dispatched">Dispatched</SelectItem>
                  <SelectItem value="Collected">Collected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <PageEmpty
              icon={<Flame className="size-6 text-muted-foreground" />}
              title={hasFilters ? 'No orders match your filters' : 'No approved LPG orders yet'}
              description={hasFilters ? 'Try adjusting your search or filter criteria.' : 'Approved LPG cooking gas orders will appear here once order requests are reviewed and approved.'}
              actionLabel={hasFilters ? undefined : 'View Order Requests'}
              onAction={hasFilters ? undefined : () => navigate({ to: '/lpg-order-request' as any })}
              hasFilters={hasFilters}
              onClearFilters={() => { setSearchTerm(''); setPaymentFilter('all'); setCollectionFilter('all') }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead>Cylinders</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Collection</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRequests.map((req: any) => (
                      <TableRow
                        key={req.id}
                        className="hover:bg-muted/50 transition cursor-pointer"
                        onClick={() => navigate({ to: '/lpg-orders/details' as any, search: { id: String(req.id) } as any })}
                      >
                        <TableCell className="font-mono font-semibold text-primary">
                          {req.requestNumber}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground">{req.customerName}</p>
                            {req.deliveryState && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="size-3" />
                                <span>{req.deliveryState}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Flame className="size-3.5 text-muted-foreground" />
                            <span>{req.stationName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {Number(req.cylinderQuantity).toLocaleString()} x {req.cylinderSizeKg}Kg
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {req.totalAmount ? formatCurrency(Number(req.totalAmount)) : '—'}
                        </TableCell>
                        <TableCell>{paymentStatusBadge(req.paymentStatus)}</TableCell>
                        <TableCell>{collectionStatusBadge(req.collectionStatus)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(req.createdAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10 gap-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate({ to: '/lpg-orders/details' as any, search: { id: String(req.id) } as any })
                            }}
                          >
                            <Eye className="size-3.5" />
                            View
                          </Button>
                        </TableCell>
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
