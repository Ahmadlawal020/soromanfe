import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  Search, X, Download, Loader2, Landmark, Send, CreditCard, User, ArrowRightLeft,
  Hash, Clock, Globe, FileText, Info, ShieldCheck, Banknote,
} from 'lucide-react'

import { PageHeader } from '#/components/PageHeader'
import { StatCard, StatCardGrid } from '#/components/ui/stat-card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { NativeSelect } from '#/components/ui/native-select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '#/components/ui/dialog'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { FilterBar } from '#/components/FilterBar'
import { Pagination } from '#/components/Pagination'
import { MICRO, PANEL } from '#/lib/panel'
import { cn } from '#/lib/utils'
import { naira } from '#/routes/pfi/-pfi-utils'
import { routeGuard } from '#/lib/route-guard'
import {
  useFinanceReport, isPaystackFunding,
  type FinanceReportOrder, type OrderFunding,
} from '#/lib/hooks/useFinanceReport'

export const Route = createFileRoute('/confirmed-payments/')({
  beforeLoad: () => routeGuard('/confirmed-payments'),
  component: FinanceReportPage,
})

function Row({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: any }) {
  if (!value) return null
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground font-normal uppercase flex items-center gap-1.5">
        {Icon && <Icon className="size-3" />} {label}
      </p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}

/** One funding entry — Paystack sender/receiver, or manual bank-transfer details. */
function FundingCard({ funding }: { funding: OrderFunding }) {
  const ps = (funding.paystackDetails || {}) as Record<string, any>
  const paystack = isPaystackFunding(funding)
  const recorder = funding.recorderFirstName ? `${funding.recorderFirstName} ${funding.recorderSurname || ''}`.trim() : null

  return (
    <div className={cn('rounded-lg border p-3', paystack ? 'border-primary/20 bg-primary/5' : 'border-warning/20 bg-warning/5')}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge className={paystack ? 'bg-primary/15 text-primary border-primary/30 font-normal' : 'bg-warning/15 text-warning border-warning/30 font-normal'}>
          {paystack ? `Paystack${ps.channel ? ` · ${String(ps.channel).replace(/_/g, ' ')}` : ''}` : 'Manual Bank Transfer'}
        </Badge>
        <span className="text-sm font-semibold">{naira(Number(funding.amount))}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {paystack ? (
          <>
            <Row label="Sender name" value={ps.senderName} icon={Send} />
            <Row label="Sender bank" value={ps.senderBankName} icon={Landmark} />
            <Row label="Sender account" value={ps.senderAccountNumber} icon={CreditCard} />
            <Row label="Sender country" value={ps.senderCountry} icon={Globe} />
            <Row label="DVA (receiver) bank" value={ps.receiverBankName} icon={Landmark} />
            <Row label="DVA account number" value={ps.receiverAccountNumber} icon={CreditCard} />
            <Row label="DVA account name" value={ps.receiverAccountName} icon={User} />
            <Row label="Gateway status" value={ps.gatewayResponse || ps.status} icon={ShieldCheck} />
            <Row label="Currency" value={ps.currency} icon={Banknote} />
            <Row label="Fees" value={ps.fees != null ? naira(Number(ps.fees)) : undefined} />
            <Row label="Transaction ID" value={ps.transactionId} icon={Hash} />
            <Row label="Narration" value={ps.senderNarration} icon={FileText} />
          </>
        ) : (
          <>
            <Row label="Depositor / payer" value={ps.senderName || ps.depositorName} icon={User} />
            <Row label="Receiving bank" value={ps.bankName || ps.receiverBankName} icon={Landmark} />
            <Row label="Receiving account name" value={ps.accountName || ps.receiverAccountName} icon={User} />
            <Row label="Receiving account number" value={ps.accountNumber || ps.receiverAccountNumber} icon={CreditCard} />
            <Row
              label="Payment date"
              value={ps.paidAt || ps.paymentDate ? format(new Date(String(ps.paidAt || ps.paymentDate)), 'd MMM yyyy') : undefined}
              icon={Clock}
            />
          </>
        )}
        <Row label="Deposit reference" value={funding.depositReference} icon={Hash} />
        <Row label="Recorded by" value={recorder} icon={User} />
      </div>
    </div>
  )
}

function OrderDetailDialog({ order, open, onOpenChange }: { order: FinanceReportOrder | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{naira(Number(order.totalAmount))}</DialogTitle>
          <DialogDescription>
            {order.reference} · {order.customerName || 'Unknown customer'}
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-foreground/10">
          <div className="pb-3">
            <p className={cn(MICRO, 'pb-1 text-muted-foreground')}>Order</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Row label="Reference" value={order.reference} />
              <Row label="Status" value={order.status} />
              <Row label="Confirmed" value={order.paymentConfirmedAt ? format(new Date(order.paymentConfirmedAt), 'd MMM yyyy, HH:mm') : undefined} />
              <Row label="Depot" value={order.depotName} />
              <Row label="Product" value={order.productName} />
              <Row label="Quantity" value={order.quantity ? String(order.quantity) : undefined} />
              <Row label="Delivery type" value={order.deliveryType} />
              <Row label="Order DVA" value={[order.virtualAccountBank, order.virtualAccountNumber].filter(Boolean).join(' · ')} />
            </div>
          </div>

          <div className="py-3">
            <p className={cn(MICRO, 'pb-1 text-muted-foreground')}>Customer</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Row label="Name" value={order.customerName} />
              <Row label="Phone" value={order.customerPhone} />
              <Row label="Email" value={order.customerEmail} />
              <Row label="Company" value={order.customerCompanyName} />
              <Row label="Standing DVA" value={[order.customerVirtualAccountBank, order.customerVirtualAccountNumber].filter(Boolean).join(' · ')} />
            </div>
          </div>

          <div className="py-3 space-y-3">
            <p className={cn(MICRO, 'text-muted-foreground')}>
              Payment source{order.funding.length ? ` (${order.funding.length})` : ''}
            </p>
            {!order.fundingTracked ? (
              <p className="rounded-lg border border-foreground/15 bg-muted/40 p-3 text-sm text-muted-foreground">
                Payment source not tracked — this order was paid before detailed payment tracking began.
              </p>
            ) : (
              <>
                {order.funding.map((f) => <FundingCard key={f.depositId} funding={f} />)}
                {order.unattributedAmount > 0 && (
                  <p className="rounded-lg border border-foreground/15 bg-muted/40 p-3 text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="size-4 shrink-0" />
                    {naira(order.unattributedAmount)} of this payment came from wallet balance that predates detailed tracking.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function methodBadge(order: FinanceReportOrder) {
  if (!order.fundingTracked) {
    return <Badge variant="outline" className="text-muted-foreground font-normal">Not tracked</Badge>
  }
  const hasPaystack = order.funding.some(isPaystackFunding)
  const hasManual = order.funding.some((f) => !isPaystackFunding(f))
  if (hasPaystack && hasManual) return <Badge className="bg-info/15 text-info border-info/30 font-normal">Mixed</Badge>
  if (hasPaystack) return <Badge className="bg-primary/15 text-primary border-primary/30 font-normal">Paystack</Badge>
  return <Badge className="bg-warning/15 text-warning border-warning/30 font-normal">Manual</Badge>
}

function FinanceReportPage() {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid' | 'all'>('Paid')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const [viewing, setViewing] = useState<FinanceReportOrder | null>(null)

  const { data, isLoading, isError, error, refetch, isFetching } = useFinanceReport({
    search: search || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    paymentStatus,
    page,
    limit,
  })

  const rows = data?.orders || []
  const totals = data?.totals
  const pagination = data?.pagination
  const hasFilters = !!(search || dateFrom || dateTo || paymentStatus !== 'Paid')

  const exportCsv = () => {
    const head = ['S/N', 'Date', 'Order Ref', 'Customer', 'Phone', 'Amount', 'Method', 'Status']
    const body = rows.map((o, i) => [
      String((pagination ? (pagination.page - 1) * pagination.limit : 0) + i + 1),
      o.paymentConfirmedAt ? format(new Date(o.paymentConfirmedAt), 'yyyy-MM-dd HH:mm') : '',
      o.reference,
      o.customerName || '',
      o.customerPhone || '',
      Number(o.totalAmount).toFixed(2),
      !o.fundingTracked ? 'Not tracked' : o.funding.some(isPaystackFunding) ? 'Paystack' : 'Manual',
      o.status,
    ])
    const csv = [head, ...body]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-report_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Finance"
        title="Finance Report"
        description="Every confirmed payment, order by order — the customer, the order, and exactly where the money came from."
        actions={
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
            <Download data-icon="inline-start" />
            Export CSV
          </Button>
        }
      />

      {!isLoading && !isError && totals && (
        <StatCardGrid count={4}>
          <StatCard icon={<Banknote />} label="Total Confirmed" value={naira(totals.totalAmount, { compact: true })} description={`${totals.count.toLocaleString()} orders`} />
          <StatCard icon={<Hash />} label="Orders" value={totals.count.toLocaleString()} />
          <StatCard icon={<ShieldCheck />} label="Funding Tracked" value={totals.trackedCount.toLocaleString()} tone="green" />
          <StatCard icon={<Info />} label="Not Tracked" value={totals.notTrackedCount.toLocaleString()} description="Paid before detailed tracking began" tone={totals.notTrackedCount > 0 ? 'amber' : undefined} />
        </StatCardGrid>
      )}

      <FilterBar>
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search order ref, customer name or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <NativeSelect className="w-40" value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value as any); setPage(1) }}>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="all">All</option>
        </NativeSelect>
        <Input type="date" className="w-40" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
        <Input type="date" className="w-40" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setPaymentStatus('Paid'); setPage(1) }}>
            <X data-icon="inline-start" />
            Clear
          </Button>
        )}
      </FilterBar>

      <div className={cn(PANEL)}>
        {isLoading ? (
          <PageLoader message="Loading finance report…" />
        ) : isError ? (
          <PageError message={(error as any)?.message || 'Failed to load'} onRetry={() => refetch()} />
        ) : rows.length === 0 ? (
          <PageEmpty
            icon={<Banknote />}
            title={hasFilters ? 'No payments match those filters' : 'No confirmed payments yet'}
            description={hasFilters ? 'Try widening the search or date range.' : 'Confirmed payments will show up here as orders are paid.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">S/N</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Order Ref</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Depot / Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((o, i) => (
                    <TableRow key={o.id} className="cursor-pointer" onClick={() => setViewing(o)}>
                      <TableCell className="text-muted-foreground">
                        {pagination ? (pagination.page - 1) * pagination.limit + i + 1 : i + 1}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {o.paymentConfirmedAt ? format(new Date(o.paymentConfirmedAt), 'd MMM yyyy') : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{o.reference}</TableCell>
                      <TableCell className="max-w-[14rem] truncate">
                        <div>{o.customerName || '—'}</div>
                        {o.customerPhone && <div className="text-xs text-muted-foreground">{o.customerPhone}</div>}
                      </TableCell>
                      <TableCell className="max-w-[12rem] truncate text-muted-foreground">
                        {[o.depotName, o.productName].filter(Boolean).join(' · ') || '—'}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">{naira(Number(o.totalAmount))}</TableCell>
                      <TableCell>{methodBadge(o)}</TableCell>
                      <TableCell>
                        <Badge variant={o.status === 'Completed' ? 'default' : 'secondary'}>{o.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {isFetching && (
              <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Updating…
              </div>
            )}

            {pagination && (
              <div className="px-4">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  pageSize={pagination.limit}
                  totalItems={pagination.total}
                  onPageChange={setPage}
                  onPageSizeChange={(s) => { setLimit(s); setPage(1) }}
                />
              </div>
            )}
          </>
        )}
      </div>

      <OrderDetailDialog order={viewing} open={!!viewing} onOpenChange={(o) => !o && setViewing(null)} />
    </div>
  )
}
