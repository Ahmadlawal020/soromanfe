import { useState, useMemo, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { FileSearch2, Search, Plus, CheckCircle2, DropletIcon, Package, Banknote, X, Loader2, SearchX, FileText, MapPin } from 'lucide-react'
import { usePfiList, type Pfi } from '#/lib/hooks/usePfis'
import { toNum } from '#/lib/utils'

export const Route = createFileRoute('/pfi/')({
  component: PFIDashboard,
})

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'active': return <Badge className="bg-success text-success-foreground">Active</Badge>
    case 'finished': return <Badge variant="secondary">Finished</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function fmtQty(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function PFIDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading } = usePfiList({ search: searchTerm || undefined, status: selectedStatus !== 'all' ? selectedStatus : undefined })

  const pfis: Pfi[] = Array.isArray(data) ? data : (data?.pfis || data?.results || [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStatus])

  const totalItems = pfis.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedPfis = pfis.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const stats = useMemo(() => {
    let totalStarting = 0, totalSold = 0, totalRemaining = 0, totalAmount = 0
    let activeCount = 0, finishedCount = 0
    pfis.forEach(p => {
      const starting = Number(p.startingQtyLitres || 0)
      const sold = Number(p.soldQtyLitres || 0)
      const amount = toNum(p.totalAmount)
      totalStarting += starting
      totalSold += sold
      totalRemaining += Math.max(0, starting - sold)
      totalAmount += amount
      if (p.status === 'active') activeCount++
      else finishedCount++
    })
    return { totalStarting, totalSold, totalRemaining, totalAmount, activeCount, finishedCount, total: pfis.length }
  }, [pfis])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">PFI Tracking</h1>
          <p className="text-muted-foreground">Monitor PFIs by location and product, track sold and remaining quantities.</p>
        </div>
        <Button size="sm" className="gradient-primary text-white border-0" onClick={() => navigate({ to: '/pfi/form' })}>
          <Plus className="w-4 h-4 mr-2" />Add PFI
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stats-card">
          <CardContent className="p-4 flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">Active PFIs</p><p className="text-2xl font-bold text-success">{stats.activeCount}</p></div>
            <FileSearch2 className="w-8 h-8 text-success" />
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-4 flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">Finished PFIs</p><p className="text-2xl font-bold text-muted-foreground">{stats.finishedCount}</p></div>
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-4 flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">Total Qty (L)</p><p className="text-2xl font-bold">{fmtQty(stats.totalStarting)}</p></div>
            <DropletIcon className="w-8 h-8 text-primary" />
          </CardContent>
        </Card>
        <Card className="stats-card">
          <CardContent className="p-4 flex justify-between items-center">
            <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-xl font-bold text-success">{fmtCurrency(stats.totalAmount)}</p></div>
            <Banknote className="w-8 h-8 text-success" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>PFI Directory</CardTitle>
              <CardDescription>Browse active and finished pro forma invoices</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input type="text" placeholder="Search PFI number, product..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors" aria-label="Clear search"><X size={10} /></button>}
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
          ) : pfis.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-border mb-4"><SearchX size={24} className="text-muted-foreground" /></div>
              <p className="text-sm font-medium text-foreground">No PFIs found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter criteria.</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedStatus('all') }} className="mt-4 text-primary"><X size={14} /> Clear filters</Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PFI No</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Qty (Ltr)</TableHead>
                      <TableHead className="text-success">Sold (Ltr)</TableHead>
                      <TableHead className="text-warning">Remaining (Ltr)</TableHead>
                      <TableHead>Amount (₦)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPfis.map((pfi: Pfi) => {
                      const starting = Number(pfi.startingQtyLitres || 0)
                      const sold = Number(pfi.soldQtyLitres || 0)
                      const remaining = Math.max(0, starting - sold)
                      const amount = toNum(pfi.totalAmount)
                      return (
                        <TableRow key={pfi._id || pfi.id} className="cursor-pointer hover:bg-muted transition" onClick={() => navigate({ to: '/pfi/details' as any, search: { id: String(pfi._id || pfi.id) } as any })}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium shrink-0">
                                <FileText size={18} />
                              </div>
                              <div>
                                <p className="font-semibold text-primary">{pfi.pfiNumber}</p>
                                <p className="text-xs text-muted-foreground">
                                  {pfi.pfiDate ? new Date(pfi.pfiDate).toLocaleDateString() : '—'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <MapPin size={14} className="text-muted-foreground shrink-0" />
                              <span>{pfi.locationName || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <Package size={14} className="text-muted-foreground shrink-0" />
                              <span>{pfi.productName || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{fmtQty(starting)}</TableCell>
                          <TableCell className="text-success font-medium">{fmtQty(sold)}</TableCell>
                          <TableCell className="text-warning font-medium">
                            <div className="flex flex-col gap-1 w-full max-w-[100px]">
                              <span>{fmtQty(remaining)}</span>
                              {starting > 0 && (
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
                                  <div className="h-full bg-warning rounded-full" style={{ width: `${Math.min(100, (remaining / starting) * 100)}%` }} />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-success">{fmtCurrency(amount)}</TableCell>
                          <TableCell>{getStatusBadge(pfi.status)}</TableCell>
                        </TableRow>
                      )
                    })}
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
