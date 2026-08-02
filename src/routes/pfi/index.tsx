import { useState, useMemo } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Search, Plus, Package, Banknote, Droplets, TriangleAlert,
  ArrowUpDown, Lock, Pencil, Download, X,
} from 'lucide-react'

import { StatCard, StatCardGrid } from '#/components/ui/stat-card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { NativeSelect } from '#/components/ui/native-select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { FilterBar } from '#/components/FilterBar'
import { PfiDetailDialog } from '#/components/PfiDetailDialog'
import { PfiCloseDialog } from '#/components/PfiCloseDialog'
import { MICRO, PANEL } from '#/lib/panel'
import { cn, getErrorMessage } from '#/lib/utils'
import { usePfiList, type PfiWithFinancials } from '#/lib/hooks/usePfis'
import {
  naira, litres, moneyTone, SurplusDeficit, SellThroughBar,
} from '#/routes/pfi/-pfi-utils'
import { downloadPfiReport, downloadMasterReport } from '#/routes/pfi/-pfi-report'

export const Route = createFileRoute('/pfi/')({
  component: PFIDashboard,
})

type SortKey = 'pfiNumber' | 'cost' | 'revenue' | 'profit' | 'remaining' | 'sellThrough'

const COLUMNS: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
  { key: 'cost', label: 'Total cost', numeric: true },
  { key: 'revenue', label: 'Revenue', numeric: true },
  { key: 'profit', label: 'Profit / loss', numeric: true },
]

/**
 * Null for an unpriced batch, which is not the same as a low value — sorting
 * one as if it were the worst loss in the book would put the batches nobody
 * has costed at the top of a list about money.
 */
function sortValue(p: PfiWithFinancials, key: SortKey): number | string | null {
  const f = p.financials
  switch (key) {
    case 'pfiNumber': return p.pfiNumber || ''
    case 'cost': return f.totalCost
    case 'revenue': return f.revenue
    case 'profit': return f.profitLoss
    case 'remaining': return f.remaining
    case 'sellThrough': return f.sellThrough
  }
}

function PFIDashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'profit', dir: 'asc' })
  const [detailId, setDetailId] = useState<number | null>(null)
  const [closing, setClosing] = useState<PfiWithFinancials | null>(null)

  const { data, isLoading, isError, error, refetch } = usePfiList({
    search: search || undefined,
    status: status !== 'all' ? status : undefined,
  })

  const pfis = (data?.pfis || []) as PfiWithFinancials[]
  const hasFilters = !!search || status !== 'all'

  const rows = useMemo(() => {
    const list = [...pfis]
    list.sort((a, b) => {
      const av = sortValue(a, sort.key)
      const bv = sortValue(b, sort.key)
      // Unpriced batches sink to the bottom whichever way the column is sorted.
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'string' ? av.localeCompare(String(bv)) : av - (bv as number)
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [pfis, sort])

  /**
   * Portfolio totals.
   *
   * Cost and profit skip batches with no BL or price — adding a null in as
   * zero would understate the portfolio cost and overstate its profit.
   */
  const stats = useMemo(() => {
    let cost = 0, revenue = 0, expenses = 0, remaining = 0, deficitCost = 0
    let costed = 0, uncosted = 0, active = 0, partSold = 0
    for (const p of pfis) {
      const f = p.financials
      revenue += f.revenue
      expenses += f.totalExpenses
      remaining += f.remaining
      if (f.deficitCost != null) deficitCost += f.deficitCost
      if (f.totalCost != null) { cost += f.totalCost; costed++ } else uncosted++
      if (p.status === 'active') active++
      if (!f.profitIsMeaningful && f.sellThrough != null) partSold++
    }
    return {
      cost, revenue, expenses, remaining, deficitCost, costed, uncosted, active, partSold,
      profit: costed > 0 ? revenue - cost : null,
      count: pfis.length,
    }
  }, [pfis])

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }))

  if (isLoading) return <PageLoader />
  if (isError) return <PageError message={getErrorMessage(error)} onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
      eyebrow="Admin"
      title="PFI Tracking"
      description="One cargo batch each — what it cost, what you spent moving it, and what it sold for."
      actions={
        <>
          <div className="flex gap-2">
          <Button variant="outline" onClick={() => downloadMasterReport(pfis)} disabled={pfis.length === 0}>
          <Download data-icon="inline-start" />
          Master report
          </Button>
          <Button onClick={() => navigate({ to: '/pfi/form' })}>
          <Plus data-icon="inline-start" />
          New PFI
          </Button>
          </div>
        </>
      }
    />

      <StatCardGrid count={4}>
        <StatCard
          icon={<Package />} label="Batches" value={stats.count}
          description={`${stats.active} active · ${stats.count - stats.active} finished`}
        />
        <StatCard
          icon={<Banknote />} label="Total cost" value={naira(stats.cost, { compact: true })}
          tone="neutral"
          description={
            stats.uncosted > 0
              ? `${stats.uncosted} batch${stats.uncosted === 1 ? '' : 'es'} not yet priced — excluded`
              : `Cargo + ${naira(stats.expenses, { compact: true })} expenses`
          }
        />
        <StatCard
          icon={<Banknote />} label="Revenue" value={naira(stats.revenue, { compact: true })}
          description="Invoiced on paid, released, loading and completed orders"
        />
        <StatCard
          icon={<Droplets />} label="Stock remaining" value={litres(stats.remaining)}
          tone={stats.remaining > 0 ? 'amber' : 'green'}
          description={
            stats.partSold > 0
              ? `${stats.partSold} batch${stats.partSold === 1 ? '' : 'es'} part-sold — profit not yet real`
              : 'Every batch fully sold'
          }
        />
      </StatCardGrid>

      {/* A deficit is money paid for product that never arrived, and nothing
          else in the system reports it as a cost. */}
      {stats.deficitCost > 0 && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/5 p-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-sm text-muted-foreground">
            <span className="font-normal text-destructive">{naira(stats.deficitCost)}</span> across this
            portfolio was paid for product that never landed — cargo billed on the BL quantity that did
            not measure into the tank. It is already inside the loss figures, but nothing else names it.
          </p>
        </div>
      )}

      <FilterBar>
        <div className="relative min-w-[12rem] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
        className="pl-8" placeholder="Search PFI number, vessel, location…"
        value={search} onChange={(e) => setSearch(e.target.value)}
        />
        </div>
        <NativeSelect className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="finished">Finished</option>
        </NativeSelect>
        {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatus('all') }}>
        <X data-icon="inline-start" />
        Clear
        </Button>
        )}
      </FilterBar>

      <div className={cn(PANEL)}>

        {rows.length === 0 ? (
          <PageEmpty
            icon={<Package />}
            title={hasFilters ? 'No PFIs match those filters' : 'No PFIs yet'}
            description={
              hasFilters
                ? 'Try a different search or status.'
                : 'Create one to start tracking a cargo batch.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PFI</TableHead>
                  <TableHead className="hidden lg:table-cell">BL vs tank</TableHead>
                  <TableHead className="hidden md:table-cell">Sell-through</TableHead>
                  {COLUMNS.map((c) => (
                    <TableHead key={c.key} className="text-right">
                      <button
                        type="button"
                        className="ml-auto inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort(c.key)}
                      >
                        {c.label}
                        <ArrowUpDown className={cn('size-3', sort.key === c.key ? 'opacity-100' : 'opacity-30')} />
                      </button>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => {
                  const f = p.financials
                  return (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer"
                      onClick={() => setDetailId(Number(p.id))}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-normal">{p.pfiNumber}</span>
                          <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="shrink-0">
                            {p.status === 'active' ? 'Active' : 'Finished'}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {[p.productName, p.locationName].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </TableCell>

                      <TableCell className="hidden lg:table-cell">
                        <p className="text-sm tabular-nums">{litres(f.blQtyLitres)}</p>
                        <SurplusDeficit litres={f.surplusDeficitLitres} className="text-xs" />
                      </TableCell>

                      <TableCell className="hidden md:table-cell">
                        <SellThroughBar value={f.sellThrough} className="min-w-[7rem]" />
                        <p className="mt-0.5 text-xs text-muted-foreground">{litres(f.remaining)} left</p>
                      </TableCell>

                      <TableCell className="text-right tabular-nums">{naira(f.totalCost, { compact: true })}</TableCell>
                      <TableCell className="text-right tabular-nums">{naira(f.revenue, { compact: true })}</TableCell>
                      <TableCell className={cn('text-right tabular-nums', moneyTone(f.profitLoss))}>
                        {naira(f.profitLoss, { compact: true })}
                        {/* A part-sold batch charges full cost against partial
                            revenue, so the figure beside this is not yet real. */}
                        {!f.profitIsMeaningful && f.sellThrough != null && (
                          <span
                            className="ml-1 cursor-help text-muted-foreground"
                            title={`Only ${Math.round(f.sellThrough * 100)}% sold — full cargo cost is charged against partial revenue, so this is not yet a real figure.`}
                          >
                            *
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          {p.status === 'active' && (
                            <Button variant="ghost" size="icon-sm" onClick={() => setClosing(p)} title="Close PFI">
                              <Lock /><span className="sr-only">Close</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="icon-sm" title="Edit"
                            onClick={() => navigate({ to: '/pfi/form', search: { id: String(p.id) } as any })}
                          >
                            <Pencil /><span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost" size="icon-sm" title="Download report"
                            onClick={() => downloadPfiReport(Number(p.id))}
                          >
                            <Download /><span className="sr-only">Report</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {rows.length > 0 && (
          <p className={cn(MICRO, 'border-t border-foreground/10 p-3 text-muted-foreground')}>
            {rows.length} batch{rows.length === 1 ? '' : 'es'}
            {stats.partSold > 0 && <> · * profit not yet meaningful on {stats.partSold}</>}
          </p>
        )}
      </div>

      <PfiDetailDialog
        pfiId={detailId}
        open={detailId != null}
        onOpenChange={(o) => !o && setDetailId(null)}
        onDownloadReport={downloadPfiReport}
      />
      <PfiCloseDialog
        pfi={closing}
        open={closing != null}
        onOpenChange={(o) => !o && setClosing(null)}
      />
    </div>
  )
}
