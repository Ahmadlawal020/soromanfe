import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { Building2, MapPin, Warehouse, Package, CheckCircle2, Clock, DollarSign, Search, Plus, X } from 'lucide-react'
import { useOrderList } from '#/lib/hooks/useOrders'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { Pagination } from '#/components/Pagination'


export const Route = createFileRoute('/orders/')({
  component: OrdersDashboard,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value)
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Completed':
      return <Badge className="bg-success text-success-foreground">Completed</Badge>
    case 'Pending':
      return <Badge className="bg-warning text-warning-foreground">Pending</Badge>
    case 'Cancelled':
      return <Badge className="bg-destructive text-destructive-foreground">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function OrdersDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const POLL_INTERVAL = 30_000
  const { data, isLoading, isError, error, refetch } = useOrderList({ refetchInterval: POLL_INTERVAL })
  const orders = data?.orders || []

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStatus])

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch =
      !searchTerm ||
      (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName || order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerCompanyName || order.customer?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.productName || order.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      selectedStatus === 'all' || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const totalItems = filteredOrders.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const hasFilters = searchTerm || selectedStatus !== 'all'

  const totalOrders = filteredOrders.length
  const completedOrders = filteredOrders.filter((o: any) => o.status === 'Completed').length
  const pendingOrders = filteredOrders.filter((o: any) => o.status === 'Pending').length
  const totalValue = filteredOrders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">View and track all customer product orders, delivery types, and status.</p>
        </div>
        <Button size="sm" className="gradient-primary text-white border-0" onClick={() => navigate({ to: '/admin-order' as any })}>
          <Plus className="w-4 h-4 mr-2" />Place New Order
        </Button>
      </div>

      {!isLoading && !isError && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stats-card"><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">{totalOrders}</p></div><Package className="w-8 h-8 text-primary" /></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">Completed</p><p className="text-2xl font-bold text-success">{completedOrders}</p></div><CheckCircle2 className="w-8 h-8 text-success" /></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-warning">{pendingOrders}</p></div><Clock className="w-8 h-8 text-warning" /></CardContent></Card>
        <Card className="stats-card"><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">Total Value</p><p className="text-2xl font-bold text-info">{formatCurrency(totalValue)}</p></div><DollarSign className="w-8 h-8 text-info" /></CardContent></Card>
      </div>
      )}

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><CardTitle>Order Register</CardTitle><CardDescription>A complete log of all product orders processed by the administration</CardDescription></div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input type="text" placeholder="Search order no, customer, product..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors" aria-label="Clear search"><X size={10} /></button>}
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoader message="Loading orders..." />
          ) : isError ? (
            <PageError message={(error as any)?.message || 'Failed to load orders'} onRetry={() => refetch()} />
          ) : filteredOrders.length === 0 ? (
            <PageEmpty
              icon={<Package size={24} className="text-muted-foreground" />}
              title={hasFilters ? 'No orders match your filters' : 'No orders yet'}
              description={hasFilters ? 'Try adjusting your search or filter criteria.' : 'Orders placed via the Admin Order page will appear here.'}
              actionLabel={hasFilters ? undefined : 'Place Order'}
              onAction={hasFilters ? undefined : () => navigate({ to: '/admin-order' as any })}
              hasFilters={hasFilters}
              onClearFilters={() => { setSearchTerm(''); setSelectedStatus('all') }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order No.</TableHead>
                      <TableHead>Customer / Company</TableHead>
                      <TableHead>State & Depot</TableHead>
                      <TableHead>Product Details</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Delivery Type</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order: any) => {
                      const custName = order.customerName || order.customer?.name || 'Unknown'
                      const compName = order.customerCompanyName || order.customer?.companyName
                      const dName = order.depotName || order.depot?.name || 'Unknown'
                      const pName = order.productName || order.product?.name || 'Unknown'
                      const pUnit = order.productUnit || order.product?.unit || 'Liters'
                      const isPaid = order.paymentStatus === 'Paid'

                      return (
                        <TableRow
                          key={order._id || order.id}
                          className="hover:bg-muted/50 transition cursor-pointer"
                          onClick={() => navigate({ to: '/orders/details' as any, search: { id: order._id || order.id } as any })}
                        >
                          <TableCell className="font-mono font-semibold text-primary">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-medium text-foreground">{custName}</p>
                              {compName && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Building2 size={12} />
                                  <span>{compName}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5 text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin size={12} className="text-primary" />
                                <span>{order.state}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Warehouse size={12} />
                                <span>{dName}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <Package size={14} className="text-muted-foreground" />
                              <span>{pName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {Number(order.quantity)?.toLocaleString()} {pUnit}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {formatCurrency(Number(order.totalAmount) || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {order.deliveryType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={isPaid ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
                              {isPaid ? 'Paid' : 'Unpaid'}
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                        </TableRow>
                      )
                    })}
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
