import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { Package, Clock, CheckCircle, DollarSign, Search, Plus, X, Eye, FileText, MapPin, Truck } from 'lucide-react'
import { useDangoteOrderRequests } from '#/lib/hooks/useDangoteOrders'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { Pagination } from '#/components/Pagination'

export const Route = createFileRoute('/dangote-orders/')({
  component: DangoteOrdersDashboard,
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
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle size={12} /> Paid</Badge>
    case 'Unpaid':
      return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1"><Clock size={12} /> Unpaid</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function collectionStatusBadge(status: string) {
  switch (status) {
    case 'Collected':
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle size={12} /> Collected</Badge>
    case 'Dispatched':
      return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1"><Truck size={12} /> Dispatched</Badge>
    case 'Pending':
      return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1"><Clock size={12} /> Pending</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function DangoteOrdersDashboard() {
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

  const { data, isLoading, isError, error, refetch } = useDangoteOrderRequests({
    search: debouncedSearch || undefined,
    status: 'Approved',
    limit: 100,
  })

  const requests = data?.requests || []
  const hasFilters = !!(debouncedSearch || paymentFilter !== 'all' || collectionFilter !== 'all')

  // Filter by payment and collection status
  const filteredRequests = requests.filter((req: any) => {
    const matchesPayment = paymentFilter === 'all' || req.paymentStatus === paymentFilter
    const matchesCollection = collectionFilter === 'all' || req.collectionStatus === collectionFilter
    return matchesPayment && matchesCollection
  })

  // Stats
  const totalOrders = filteredRequests.length
  const paidOrders = filteredRequests.filter((r: any) => r.paymentStatus === 'Paid').length
  const unpaidOrders = filteredRequests.filter((r: any) => r.paymentStatus === 'Unpaid').length
  const totalValue = filteredRequests.reduce((sum: number, r: any) => sum + (Number(r.totalAmount) || 0), 0)

  // Pagination
  const totalItems = filteredRequests.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (isLoading) {
    return <PageLoader message="Loading Dangote delivery orders..." />
  }

  if (isError) {
    return <PageError message={(error as any)?.message || 'Failed to load orders'} onRetry={refetch} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dangote Delivery Orders</h1>
          <p className="text-muted-foreground">View and track all Dangote delivery orders, payment, and collection status.</p>
        </div>
        <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white border-0" onClick={() => navigate({ to: '/admin-order/dangote-request-form' as any })}>
          <Plus className="w-4 h-4 mr-2" />Place Dangote Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stats-card">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
            <FileText className="w-8 h-8 text-primary" />
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold text-emerald-600">{paidOrders}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Unpaid</p>
              <p className="text-2xl font-bold text-amber-600">{unpaidOrders}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-600" />
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-info">{formatCurrency(totalValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-info" />
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Dangote Delivery Order Register</CardTitle>
              <CardDescription>A complete log of all Dangote delivery orders</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search request ID, customer, product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={10} />
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
              icon={<FileText size={24} className="text-muted-foreground" />}
              title={hasFilters ? 'No orders match your filters' : 'No approved Dangote delivery orders yet'}
              description={hasFilters ? 'Try adjusting your search or filter criteria.' : 'Approved Dangote delivery orders will appear here once order requests are reviewed and approved.'}
              actionLabel={hasFilters ? undefined : 'View Order Requests'}
              onAction={hasFilters ? undefined : () => navigate({ to: '/dangote-order-request' as any })}
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
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
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
                        onClick={() => navigate({ to: '/dangote-orders/details' as any, search: { id: String(req.id) } as any })}
                      >
                        <TableCell className="font-mono font-semibold text-primary">
                          {req.requestNumber}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground">{req.customerName}</p>
                            {req.deliveryState && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin size={12} />
                                <span>{req.deliveryState}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Package size={14} className="text-muted-foreground" />
                            <span>{req.product}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {Number(req.quantity).toLocaleString()} {req.quantityUnit}
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
                            className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10 gap-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate({ to: '/dangote-orders/details' as any, search: { id: String(req.id) } as any })
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
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
