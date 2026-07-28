import { useState, useMemo, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { FileSearch2, Search, Plus, DropletIcon, Scale, Package, Banknote, X, FileText, MapPin } from 'lucide-react'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { Pagination } from '#/components/Pagination'
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

function fmtQty(n: number, decimals: number = 0) {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function isWeightBased(pfi: Pfi): boolean {
  const u = (pfi.productUnit || '').toLowerCase()
  if (u.includes('mt') || u.includes('ton') || u.includes('kg') || u.includes('weight')) return true
  if (Number(pfi.qtyVolumeMt || 0) > 0 && Number(pfi.startingQtyLitres || 0) === 0) return true
  return false
}

function getPfiUnit(pfi: Pfi): string {
  if (pfi.productUnit) return pfi.productUnit
  if (isWeightBased(pfi)) return 'MT'
  return 'Litres'
}

function getPfiQuantities(pfi: Pfi) {
  const isWeight = isWeightBased(pfi)
  const unit = getPfiUnit(pfi)
  const uLower = (unit || '').toLowerCase()

  let starting = Number(pfi.startingQtyLitres || 0)
  let sold = Number(pfi.soldQtyLitres || 0)

  if (isWeight && Number(pfi.qtyVolumeMt || 0) > 0 && starting === 0) {
    starting = Number(pfi.qtyVolumeMt)
    sold = Number(pfi.soldQtyLitres || 0)
  }

  const remaining = Math.max(0, starting - sold)

  // Compute MT equivalent for weight stat calculations (1 MT = 1000 kg)
  let startingMt = 0
  let soldMt = 0
  let remainingMt = 0

  if (Number(pfi.qtyVolumeMt || 0) > 0) {
    startingMt = Number(pfi.qtyVolumeMt)
    soldMt = starting > 0 ? (sold / starting) * startingMt : 0
    remainingMt = Math.max(0, startingMt - soldMt)
  } else if (uLower.includes('kg') || uLower.includes('kilogram')) {
    startingMt = starting / 1000
    soldMt = sold / 1000
    remainingMt = Math.max(0, startingMt - soldMt)
  } else if (uLower.includes('mt') || uLower.includes('ton')) {
    startingMt = starting
    soldMt = sold
    remainingMt = Math.max(0, startingMt - soldMt)
  }

  return { starting, sold, remaining, startingMt, soldMt, remainingMt, unit, isWeight }
}

function getPfiCosts(pfi: Pfi) {
  const q = getPfiQuantities(pfi)
  const unitPrice = toNum(pfi.unitPrice)
  const totalAmount = toNum(pfi.totalAmount)
  const purchaseCost = toNum(pfi.purchaseCost)

  let totalCost = totalAmount
  if (totalCost <= 0 && unitPrice > 0 && q.starting > 0) {
    totalCost = q.starting * unitPrice
  }
  if (totalCost <= 0 && purchaseCost > 0) {
    totalCost = purchaseCost
  }

  let soldCost = 0
  let remainingCost = 0

  if (unitPrice > 0) {
    soldCost = q.sold * unitPrice
    remainingCost = q.remaining * unitPrice
  } else if (q.starting > 0 && totalCost > 0) {
    soldCost = (q.sold / q.starting) * totalCost
    remainingCost = (q.remaining / q.starting) * totalCost
  }

  return {
    totalCost,
    soldCost,
    remainingCost,
    unitPrice,
  }
}

function PFIDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isError, error, refetch } = usePfiList({ search: searchTerm || undefined, status: selectedStatus !== 'all' ? selectedStatus : undefined })

  const pfis: Pfi[] = Array.isArray(data) ? data : (data?.pfis || data?.results || [])
  const hasFilters = !!(searchTerm || selectedStatus !== 'all')

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
    let activeCount = 0, finishedCount = 0
    let totalStartingLitres = 0, totalSoldLitres = 0, totalRemainingLitres = 0
    let totalStartingMt = 0, totalSoldMt = 0, totalRemainingMt = 0
    let cumulativeCost = 0, cumulativeSoldCost = 0, cumulativeRemainingCost = 0

    pfis.forEach(p => {
      if (p.status === 'active') activeCount++
      else finishedCount++

      const q = getPfiQuantities(p)

      // Add to volume inventory if product is litres/volume based
      if (!q.isWeight) {
        totalStartingLitres += q.starting
        totalSoldLitres += q.sold
        totalRemainingLitres += q.remaining
      }

      // Add to MT weight inventory (accounts for MT directly or kg / 1000)
      totalStartingMt += q.startingMt
      totalSoldMt += q.soldMt
      totalRemainingMt += q.remainingMt

      const c = getPfiCosts(p)
      cumulativeCost += c.totalCost
      cumulativeSoldCost += c.soldCost
      cumulativeRemainingCost += c.remainingCost
    })

    return {
      activeCount,
      finishedCount,
      total: pfis.length,
      totalStartingLitres,
      totalSoldLitres,
      totalRemainingLitres,
      totalStartingMt,
      totalSoldMt,
      totalRemainingMt,
      cumulativeCost,
      cumulativeSoldCost,
      cumulativeRemainingCost,
    }
  }, [pfis])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">PFI Tracking</h1>
          <p className="text-muted-foreground">Monitor PFIs by location and product, track weight & volume inventory, and review cumulative PFI costs.</p>
        </div>
        <Button size="sm" className="gradient-primary text-white border-0" onClick={() => navigate({ to: '/pfi/form' })}>
          <Plus className="w-4 h-4 mr-2" />Add PFI
        </Button>
      </div>

      {/* Compact Stat Cards Grid */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Status Overview */}
          <Card className="stats-card hover:border-primary/40 transition-all border-border/80">
            <CardContent className="p-3.5 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status Overview</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeCount} <span className="text-[11px] font-normal text-muted-foreground">Active</span></span>
                  <span className="text-sm font-semibold text-muted-foreground">• {stats.finishedCount} <span className="text-[11px] font-normal text-muted-foreground">Finished</span></span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stats.total} total PFIs</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileSearch2 className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Volume Inventory (L) */}
          <Card className="stats-card hover:border-blue-500/40 transition-all border-border/80">
            <CardContent className="p-3.5 flex justify-between items-center">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Volume (L)</p>
                <p className="text-xl font-bold text-foreground mt-0.5 truncate">
                  {fmtQty(stats.totalStartingLitres)} <span className="text-[11px] font-medium text-muted-foreground">L</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sold: {fmtQty(stats.totalSoldLitres)} L</span>
                  <span className="mx-1">•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Rem: {fmtQty(stats.totalRemainingLitres)} L</span>
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center shrink-0 ml-2">
                <DropletIcon className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Weight Inventory (MT) */}
          <Card className="stats-card hover:border-purple-500/40 transition-all border-border/80">
            <CardContent className="p-3.5 flex justify-between items-center">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Weight (MT)</p>
                <p className="text-xl font-bold text-foreground mt-0.5 truncate">
                  {fmtQty(stats.totalStartingMt, 2)} <span className="text-[11px] font-medium text-muted-foreground">MT</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sold: {fmtQty(stats.totalSoldMt, 2)} MT</span>
                  <span className="mx-1">•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Rem: {fmtQty(stats.totalRemainingMt, 2)} MT</span>
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center shrink-0 ml-2">
                <Scale className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Cumulative PFI Cost */}
          <Card className="stats-card hover:border-primary/40 transition-all border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
            <CardContent className="p-3.5 flex justify-between items-center">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cumulative PFI Cost</p>
                <p className="text-lg font-extrabold text-primary mt-0.5 truncate">{fmtCurrency(stats.cumulativeCost)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Sold: {fmtCurrency(stats.cumulativeSoldCost)}</span>
                  <span className="mx-1">•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Rem: {fmtCurrency(stats.cumulativeRemainingCost)}</span>
                </p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 ml-2">
                <Banknote className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Directory Table Card */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>PFI Directory</CardTitle>
              <CardDescription>Browse active and finished pro forma invoices by location, product, and measurement unit</CardDescription>
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
            <PageLoader message="Loading PFIs..." />
          ) : isError ? (
            <PageError message={(error as any)?.message || 'Failed to load'} onRetry={() => refetch()} />
          ) : pfis.length === 0 ? (
            <PageEmpty
              icon={<FileText size={24} className="text-muted-foreground" />}
              title={hasFilters ? 'No PFIs match your filters' : 'No PFIs yet'}
              description={hasFilters ? 'Try adjusting your search or filter criteria.' : 'Create your first PFI to get started.'}
              actionLabel="Create PFI"
              onAction={() => navigate({ to: '/pfi/form' })}
              hasFilters={hasFilters}
              onClearFilters={() => { setSearchTerm(''); setSelectedStatus('all') }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PFI No</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Starting Qty</TableHead>
                      <TableHead className="text-success">Sold Qty</TableHead>
                      <TableHead className="text-warning">Remaining Qty</TableHead>
                      <TableHead>Total Cost (₦)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPfis.map((pfi: Pfi) => {
                      const q = getPfiQuantities(pfi)
                      const c = getPfiCosts(pfi)
                      const decimals = q.isWeight ? 2 : 0

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
                          <TableCell>
                            <Badge variant="outline" className="font-medium text-xs">
                              {q.isWeight ? <Scale size={12} className="mr-1 text-info inline" /> : <DropletIcon size={12} className="mr-1 text-primary inline" />}
                              {q.unit}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{fmtQty(q.starting, decimals)} {q.unit}</TableCell>
                          <TableCell className="text-success font-medium">{fmtQty(q.sold, decimals)} {q.unit}</TableCell>
                          <TableCell className="text-warning font-medium">
                            <div className="flex flex-col gap-1 w-full max-w-[120px]">
                              <span>{fmtQty(q.remaining, decimals)} {q.unit}</span>
                              {q.starting > 0 && (
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
                                  <div className="h-full bg-warning rounded-full" style={{ width: `${Math.min(100, (q.remaining / q.starting) * 100)}%` }} />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-primary">{fmtCurrency(c.totalCost)}</TableCell>
                          <TableCell>{getStatusBadge(pfi.status)}</TableCell>
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

