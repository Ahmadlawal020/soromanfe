import { useMemo, useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Plus, Trash2, Truck, Printer, Loader2, Search, LogIn, PackageCheck, LogOut, CircleDashed } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { StatCard, StatCardGrid } from '#/components/ui/stat-card'
import { StatusChip } from '#/components/ui/status-chip'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { PageEmpty } from '#/components/PageEmpty'
import { TicketPrintDialog } from '#/components/TicketPrintDialog'
import { PANEL, MICRO, PANEL_RAIL, PANEL_BODY, PANEL_FOOTER } from '#/lib/panel'
import { cn } from '#/lib/utils'
import { useAllOrders } from '#/lib/hooks/useOrders'
import {
  useOrderForTicketing, useGenerateTickets, type TruckDraft, type TruckLoad,
} from '#/lib/hooks/useTickets'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/ticket/generate')({
  beforeLoad: () => routeGuard('/ticket'),
  component: GenerateTicketsPage,
})

/** Mirrors the server's per-truck ceiling so the form fails before the request. */
const MAX_TRUCK_LITRES = 60000

const emptyTruck = (): TruckDraft => ({
  quantity: '', driverName: '', driverPhone: '', truckNumber: '',
})

const qty = (n: number) => Number(n || 0).toLocaleString('en-NG')

const LOAD_STATUS: Record<string, { label: string; icon: typeof Truck; tone: 'accent' | 'warning' | 'inert' }> = {
  pending:   { label: 'Awaiting gate', icon: CircleDashed, tone: 'inert' },
  gated_in:  { label: 'At depot',      icon: LogIn,        tone: 'warning' },
  loaded:    { label: 'Loaded',        icon: PackageCheck, tone: 'warning' },
  gated_out: { label: 'Departed',      icon: LogOut,       tone: 'accent' },
}

function GenerateTicketsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [orderId, setOrderId] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<TruckDraft[]>([emptyTruck()])
  const [printLoadId, setPrintLoadId] = useState<number | null>(null)

  const { data, isLoading } = useAllOrders()
  const orders: any[] = data?.orders || []

  // Only released orders can be ticketed; Loading means some already are.
  const ticketable = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders
      .filter((o) => o.status === 'Released' || o.status === 'Loading')
      .filter((o) => !q || [o.orderNumber, o.customerName, o.depotName, o.productName]
        .some((f) => String(f ?? '').toLowerCase().includes(q)))
  }, [orders, search])

  const { data: order } = useOrderForTicketing(orderId ?? undefined)
  const generate = useGenerateTickets()

  const loads: TruckLoad[] = order?.trucks || order?.orderTrucks || []
  const ordered = Number(order?.quantity || 0)
  const ticketed = loads.reduce((s, l) => s + Number(l.quantity || 0), 0)
  const remaining = ordered - ticketed

  const draftTotal = drafts.reduce((s, d) => s + (Number(d.quantity) || 0), 0)

  // Validated here as well as on the server, so the desk sees the problem
  // before the request rather than after.
  const problems = useMemo(() => {
    const out: string[] = []
    drafts.forEach((d, i) => {
      const n = Number(d.quantity)
      const where = `Truck ${i + 1}`
      if (!d.quantity || !Number.isFinite(n) || n <= 0) out.push(`${where}: quantity required`)
      else if (n > MAX_TRUCK_LITRES) out.push(`${where}: over the ${qty(MAX_TRUCK_LITRES)} per-truck limit`)
      if (!d.truckNumber.trim()) out.push(`${where}: plate required`)
      if (!d.driverName.trim()) out.push(`${where}: driver name required`)
      if (!d.driverPhone.trim()) out.push(`${where}: driver phone required`)
    })
    if (draftTotal > remaining) {
      out.push(`Exceeds the order by ${qty(draftTotal - remaining)} ${order?.productUnit || 'L'}`)
    }
    return out
  }, [drafts, draftTotal, remaining, order])

  const setDraft = (i: number, patch: Partial<TruckDraft>) =>
    setDrafts((d) => d.map((t, j) => (j === i ? { ...t, ...patch } : t)))

  const submit = async () => {
    if (!orderId) return
    await generate.mutateAsync({ orderId, trucks: drafts })
    setDrafts([emptyTruck()])
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
      eyebrow="Operations"
      title="Generate tickets"
      description="Tickets are issued after release, one per truck, and append to what's already there."
    />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        {/* Released orders waiting to be ticketed. */}
        <section className={cn(PANEL, 'h-fit')}>
          <div className={PANEL_RAIL}>
            <span className={MICRO}>Released orders</span>
            <StatusChip tone={ticketable.length ? 'accent' : 'inert'}>
              {ticketable.length}
            </StatusChip>
          </div>
          <div className="border-b border-foreground/15 px-4 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Reference, customer, depot…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {isLoading ? (
              <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </p>
            ) : ticketable.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nothing released is waiting.
              </p>
            ) : (
              <ul className="divide-y divide-foreground/10">
                {ticketable.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => { setOrderId(o.id); setDrafts([emptyTruck()]) }}
                      className={cn(
                        'w-full px-4 py-3 text-left transition-colors duration-250 ease-luxe outline-none',
                        'hover:bg-muted/60 focus-visible:bg-muted/60',
                        orderId === o.id && 'bg-accent/5',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn('truncate text-sm font-normal', orderId === o.id && 'text-accent')}>
                          {o.orderNumber}
                        </span>
                        <StatusChip tone={o.status === 'Loading' ? 'warning' : 'accent'}>
                          {o.status}
                        </StatusChip>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {o.customerName} · {o.depotName || o.state}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {qty(Number(o.quantity))} {o.productUnit || 'L'}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* The desk. */}
        <div className="space-y-6">
          {!orderId ? (
            <PageEmpty
              title="Pick a released order"
              description="Choose one on the left to issue its loading tickets."
            />
          ) : (
            <>
              <StatCardGrid count={3}>
                <StatCard icon={<Truck />} label="Ordered" value={qty(ordered)} description={order?.productUnit || 'Litres'} />
                <StatCard icon={<PackageCheck />} label="Ticketed" value={qty(ticketed)} description={`${loads.length} truck${loads.length === 1 ? '' : 's'}`} />
                <StatCard
                  tone={remaining === 0 ? 'green' : 'amber'}
                  icon={<CircleDashed />} label="Remaining" value={qty(remaining)}
                  description={remaining === 0 ? 'Fully ticketed' : 'Still to ticket'}
                />
              </StatCardGrid>

              {/* Existing trucks. */}
              {loads.length > 0 && (
                <section className={PANEL}>
                  <div className={PANEL_RAIL}>
                    <span className={MICRO}>Issued tickets</span>
                  </div>
                  <div className="px-2 pb-2">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Plate</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead>Driver</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ticket</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loads.map((l) => {
                          const s = LOAD_STATUS[l.status] ?? LOAD_STATUS.pending
                          const Icon = s.icon
                          return (
                            <TableRow key={l.id}>
                              <TableCell className="text-muted-foreground tabular-nums">{l.truckIndex}</TableCell>
                              <TableCell className="font-normal">{l.truckNumber}</TableCell>
                              <TableCell className="text-right tabular-nums">{qty(Number(l.quantity))}</TableCell>
                              <TableCell>
                                <span className="block truncate">{l.driverName || '—'}</span>
                                {/* Only differs once the gate has seen someone else. */}
                                {l.entryDriverName && l.entryDriverName !== l.driverName && (
                                  <span className="block truncate text-xs text-warning">
                                    at gate: {l.entryDriverName}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <StatusChip tone={s.tone}>
                                  <Icon className="size-3" />
                                  {s.label}
                                </StatusChip>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon-sm" onClick={() => setPrintLoadId(l.id)}>
                                  <Printer />
                                  <span className="sr-only">Print ticket for {l.truckNumber}</span>
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              )}

              {/* New batch. */}
              <section className={PANEL}>
                <div className={PANEL_RAIL}>
                  <span className={MICRO}>
                    {loads.length ? 'Add more trucks' : 'Allocate trucks'}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {qty(draftTotal)} of {qty(remaining)} available
                  </span>
                </div>

                {remaining <= 0 ? (
                  <div className={PANEL_BODY}>
                    <p className="text-sm text-muted-foreground">
                      This order is fully ticketed. Nothing further to allocate.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={cn(PANEL_BODY, 'space-y-4')}>
                      {drafts.map((d, i) => (
                        <div key={i} className="grid gap-3 sm:grid-cols-[7rem_1fr_1fr_9rem_auto]">
                          <div className="space-y-1.5">
                            <label className={cn(MICRO, 'block text-xs text-muted-foreground')}>
                              Quantity
                            </label>
                            <Input
                              type="number" inputMode="numeric" value={d.quantity}
                              onChange={(e) => setDraft(i, { quantity: e.target.value })}
                              aria-invalid={Number(d.quantity) > MAX_TRUCK_LITRES || undefined}
                              placeholder="30000"
                              className="tabular-nums"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className={cn(MICRO, 'block text-xs text-muted-foreground')}>
                              Plate number
                            </label>
                            <Input
                              value={d.truckNumber}
                              onChange={(e) => setDraft(i, { truckNumber: e.target.value })}
                              placeholder="LAG-123-XA"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className={cn(MICRO, 'block text-xs text-muted-foreground')}>
                              Driver
                            </label>
                            <Input
                              value={d.driverName}
                              onChange={(e) => setDraft(i, { driverName: e.target.value })}
                              placeholder="Full name"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className={cn(MICRO, 'block text-xs text-muted-foreground')}>
                              Phone
                            </label>
                            <Input
                              value={d.driverPhone}
                              onChange={(e) => setDraft(i, { driverPhone: e.target.value })}
                              placeholder="0801…"
                              className="tabular-nums"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              variant="ghost" size="icon"
                              disabled={drafts.length === 1}
                              onClick={() => setDrafts((t) => t.filter((_, j) => j !== i))}
                            >
                              <Trash2 />
                              <span className="sr-only">Remove truck {i + 1}</span>
                            </Button>
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="outline" size="sm"
                        onClick={() => setDrafts((t) => [...t, emptyTruck()])}
                      >
                        <Plus data-icon="inline-start" />
                        Add truck
                      </Button>
                    </div>

                    <div className={cn(PANEL_FOOTER, 'justify-between')}>
                      <div className="min-w-0">
                        {problems.length > 0 && (
                          <p className="truncate text-xs text-muted-foreground/70">
                            {problems[0]}
                            {problems.length > 1 && ` · +${problems.length - 1} more`}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={submit}
                        disabled={problems.length > 0 || generate.isPending}
                      >
                        {generate.isPending && <Loader2 className="animate-spin" />}
                        Generate {drafts.length} ticket{drafts.length === 1 ? '' : 's'}
                      </Button>
                    </div>
                  </>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      <TicketPrintDialog
        orderId={orderId ?? undefined}
        loadId={printLoadId}
        loadIds={loads.map((l) => l.id)}
        open={printLoadId !== null}
        onOpenChange={(o) => { if (!o) setPrintLoadId(null) }}
      />
    </div>
  )
}
