import { useState, useEffect } from 'react'
import { FilterBar } from '#/components/FilterBar'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '#/components/ui/table'
import { Search, X, FileText, Eye, Clock, CheckCircle, XCircle, Flame } from 'lucide-react'
import { useLpgOrderRequests } from '#/lib/hooks/useLpgOrders'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { getErrorMessage } from '#/lib/utils'

export const Route = createFileRoute('/lpg-order-request/')({
  component: LpgOrderRequestPage,
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
      return <Badge className="bg-warning/15 text-warning border-warning/20 gap-1"><Clock className="size-3" /> Pending Review</Badge>
    case 'Approved':
      return <Badge className="bg-accent/15 text-accent border-accent/20 gap-1"><CheckCircle className="size-3" /> Approved</Badge>
    case 'Rejected':
      return <Badge variant="destructive" className="gap-1"><XCircle className="size-3" /> Rejected</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function LpgOrderRequestPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data, isLoading, isError, error, refetch } = useLpgOrderRequests({
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const requests = data?.requests || []
  const hasFilters = !!(debouncedSearch || statusFilter !== 'all')

  if (isLoading) {
    return <PageLoader message="Loading LPG order requests..." />
  }

  if (isError) {
    return <PageError message={getErrorMessage(error)} onRetry={refetch} />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
      eyebrow="LPG Home Delivery"
      title="LPG Cooking Gas Order Requests"
      description="Review and manage customer LPG cooking gas home delivery order requests"
    />

      <FilterBar>
        <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
        placeholder="Search customer, station, ID…"
        className="pl-9 pr-9"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer">
        <X className="size-4" />
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
      </FilterBar>

      <Card>
        

        <CardContent className="p-0">
          {requests.length === 0 ? (
            <PageEmpty
              icon={<FileText className="size-6 text-muted-foreground" />}
              title={hasFilters ? 'No requests match your filters' : 'No LPG order requests yet'}
              description={hasFilters ? 'Try adjusting your search or filter criteria.' : 'No LPG cooking gas order requests have been submitted yet.'}
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
                    <TableHead>Station</TableHead>
                    <TableHead className="text-right">Cylinders</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req: any, idx: number) => (
                    <TableRow key={req.id} className="hover:bg-muted/40 transition-colors duration-250 ease-luxe">
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
                          <Flame className="size-3.5 text-muted-foreground" />
                          <span className="text-sm">{req.stationName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold">
                        {Number(req.cylinderQuantity).toLocaleString()} x {req.cylinderSizeKg}Kg
                      </TableCell>
                      <TableCell>{statusBadge(req.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(req.createdAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10 gap-1 text-xs"
                          onClick={() => navigate({ to: '/lpg-order-request/review', search: { id: String(req.id) } })}
                        >
                          <Eye className="size-3.5" />
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
