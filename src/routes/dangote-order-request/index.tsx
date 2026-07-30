import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '#/components/ui/table'
import {
  Search, X, RefreshCw, FileText, Eye, Clock, CheckCircle, XCircle, Package,
} from 'lucide-react'
import { useDangoteOrderRequests } from '#/lib/hooks/useDangoteOrders'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { getErrorMessage } from '#/lib/utils'

export const Route = createFileRoute('/dangote-order-request/')({
  component: DangoteOrderRequestPage,
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

function statusBadge(status: string) {
  switch (status) {
    case 'Pending Review':
      return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1"><Clock size={12} /> Pending Review</Badge>
    case 'Approved':
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle size={12} /> Approved</Badge>
    case 'Rejected':
      return <Badge variant="destructive" className="gap-1"><XCircle size={12} /> Rejected</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function DangoteOrderRequestPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data, isLoading, isError, error, refetch } = useDangoteOrderRequests({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const requests = data?.requests || []
  const hasFilters = !!(debouncedSearch || statusFilter !== 'all')

  if (isLoading) {
    return <PageLoader message="Loading delivery order requests..." />
  }

  if (isError) {
    return <PageError message={getErrorMessage(error)} onRetry={refetch} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Dangote Delivery Order Requests
          </h1>
          <p className="text-muted-foreground text-sm">
            Review and manage customer delivery order requests for Dangote products
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 self-start sm:self-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="border-b border-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Order Request Queue</CardTitle>
              <CardDescription>Customer requests awaiting review or already processed</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customer, product, ID…"
                  className="pl-9 pr-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending Review">Pending Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {requests.length === 0 ? (
            <PageEmpty
              icon={<FileText size={24} className="text-muted-foreground" />}
              title={hasFilters ? 'No requests match your filters' : 'No order requests yet'}
              description={hasFilters ? 'Try adjusting your search or filter criteria.' : 'No Dangote delivery order requests have been submitted yet.'}
              hasFilters={hasFilters}
              onClearFilters={() => { setSearchTerm(''); setStatusFilter('all') }}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req: any, idx: number) => (
                    <TableRow key={req.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold text-primary">{req.requestNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm text-foreground">{req.customerName}</div>
                        {req.deliveryState && (
                          <div className="text-xs text-muted-foreground">{req.deliveryState}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Package size={14} className="text-muted-foreground" />
                          <span className="text-sm">{req.product}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        {Number(req.quantity).toLocaleString()} {req.quantityUnit}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        {req.totalAmount ? formatCurrency(Number(req.totalAmount)) : '—'}
                      </TableCell>
                      <TableCell>{statusBadge(req.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(req.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/10 gap-1 text-xs"
                          onClick={() => navigate({ to: '/dangote-order-request/review', search: { id: String(req.id) } })}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {req.status === 'Pending Review' ? 'Review' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
