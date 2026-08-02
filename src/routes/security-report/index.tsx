import { useMemo, useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute } from '@tanstack/react-router'
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { Truck, Droplets, FileSpreadsheet, FileText, Loader2, ClipboardList } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { StatCard, StatCardGrid } from '#/components/ui/stat-card'
import { NativeSelect } from '#/components/ui/native-select'
import { Textarea } from '#/components/ui/textarea'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { PageLoader } from '#/components/PageLoader'
import { PageEmpty } from '#/components/PageEmpty'
import { PANEL, MICRO, PANEL_RAIL, PANEL_BODY } from '#/lib/panel'
import { cn } from '#/lib/utils'
import { useAllOrders } from '#/lib/hooks/useOrders'
import { useAuthStore } from '#/modules/auth'
import api from '#/lib/api/http'

export const Route = createFileRoute('/security-report/')({
  component: SecurityReportPage,
})

const ALL = 'all'
const fmt = (n: unknown) => Number(n || 0).toLocaleString('en-NG')

type ExitRow = {
  id: number
  date: string
  truckNumber: string
  orderRef: string
  quantity: number
  exitedAt: string
  gantry: string
  loader: string
}

function SecurityReportPage() {
  const user = useAuthStore((s) => s.user)
  const today = format(new Date(), 'yyyy-MM-dd')

  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [pfi, setPfi] = useState(ALL)
  const [location, setLocation] = useState(ALL)
  const [rows, setRows] = useState<ExitRow[] | null>(null)
  const [loadingRows, setLoadingRows] = useState(false)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  const { data, isLoading } = useAllOrders()
  const orders: any[] = data?.orders || []

  const options = useMemo(() => {
    const uniq = (v: (string | null | undefined)[]) =>
      [...new Set(v.filter((x): x is string => Boolean(x)))].sort()
    return {
      pfis: uniq(orders.map((o) => o.pfiNumber)),
      locations: uniq(orders.map((o) => o.depotName || o.state)),
    }
  }, [orders])

  /**
   * One row per truck exit.
   *
   * Loads are fetched per order rather than from a reporting endpoint — this
   * backend has none. That is fine at this volume and the obvious thing to
   * move server-side first.
   */
  const build = async () => {
    setLoadingRows(true)
    try {
      const range = { start: startOfDay(new Date(from)), end: endOfDay(new Date(to)) }

      // Narrow by date before fetching loads. Without this the report would
      // issue one request per loaded order in the whole book; the exit can
      // only fall in range if the order itself was touched by then.
      const candidates = orders.filter((o) => {
        if (!['Loading', 'Completed'].includes(String(o.status))) return false
        if (pfi !== ALL && o.pfiNumber !== pfi) return false
        if (location !== ALL && (o.depotName || o.state) !== location) return false
        const touched = o.updatedAt || o.loadingStartedAt || o.createdAt
        if (touched && new Date(touched) < range.start) return false
        if (o.loadingStartedAt && new Date(o.loadingStartedAt) > range.end) return false
        return true
      })

      const out: ExitRow[] = []

      const batches = await Promise.all(
        candidates.map((o) =>
          api.get(`/orders/${o.id}/trucks`)
            .then((r) => ({ order: o, loads: r.data.data.trucks || [] }))
            .catch(() => ({ order: o, loads: [] })),
        ),
      )

      for (const { order, loads } of batches) {
        for (const l of loads) {
          if (!l.securityExitedAt) continue
          const when = new Date(l.securityExitedAt)
          if (!isWithinInterval(when, range)) continue
          out.push({
            id: l.id,
            date: format(when, 'd MMM yyyy'),
            // Falls back to the truck index when no plate was recorded.
            truckNumber: l.truckNumber || `Truck ${l.truckIndex}`,
            orderRef: order.orderNumber,
            quantity: Number(l.quantity || 0),
            exitedAt: format(when, 'HH:mm'),
            gantry: l.gantry || '—',
            loader: l.loaderName || '—',
          })
        }
      }

      out.sort((a, b) => a.orderRef.localeCompare(b.orderRef))
      setRows(out)
    } finally {
      setLoadingRows(false)
    }
  }

  // Period figures beside the running total, so both are visible at once.
  const totals = useMemo(() => {
    const period = rows ?? []
    return {
      trucksDay: period.length,
      qtyDay: period.reduce((s, r) => s + r.quantity, 0),
    }
  }, [rows])

  const cumulative = useMemo(() => {
    const done = orders.filter((o) => ['Loading', 'Completed'].includes(String(o.status)))
    return {
      trucks: done.length,
      qty: done.reduce((s, o) => s + Number(o.quantity || 0), 0),
    }
  }, [orders])

  const exportExcel = async () => {
    if (!rows?.length) return
    setExporting('excel')
    try {
      const ExcelJS = (await import('exceljs')).default
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Security exits')
      ws.columns = [
        { header: 'S/N', key: 'sn', width: 6 },
        { header: 'Date', key: 'date', width: 16 },
        { header: 'Truck No', key: 'truck', width: 18 },
        { header: 'Order Ref', key: 'ref', width: 20 },
        { header: 'Quantity', key: 'qty', width: 14 },
        { header: 'Time of Exit', key: 'time', width: 14 },
        { header: 'Gantry', key: 'gantry', width: 10 },
        { header: 'Loader', key: 'loader', width: 22 },
      ]
      ws.getRow(1).font = { bold: true }
      rows.forEach((r, i) =>
        ws.addRow({
          sn: i + 1, date: r.date, truck: r.truckNumber, ref: r.orderRef,
          qty: r.quantity, time: r.exitedAt, gantry: r.gantry, loader: r.loader,
        }),
      )
      const buf = await wb.xlsx.writeBuffer()
      download(new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }), `security-exits_${from}_${to}.xlsx`)
    } finally {
      setExporting(null)
    }
  }

  const exportPdf = async () => {
    if (!rows?.length) return
    setExporting('pdf')
    try {
      const { jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default
      const doc = new jsPDF()
      doc.setFontSize(14)
      doc.text('Soroman — Security Exits', 14, 16)
      doc.setFontSize(9)
      doc.text(`${from} to ${to} · ${rows.length} trucks · ${fmt(totals.qtyDay)} litres`, 14, 22)
      autoTable(doc, {
        startY: 28,
        head: [['S/N', 'Date', 'Truck No', 'Order Ref', 'Quantity', 'Time of Exit', 'Gantry', 'Loader']],
        body: rows.map((r, i) => [
          i + 1, r.date, r.truckNumber, r.orderRef, fmt(r.quantity), r.exitedAt, r.gantry, r.loader,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 122, 85], textColor: 255 },
      })
      doc.save(`security-exits_${from}_${to}.pdf`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
      eyebrow="Security"
      title="Security report"
      description="List of trucks cleared by security, with a summary for the selected period."
      />

      <StatCardGrid count={4}>
                <StatCard icon={<Truck />} label="Total trucks for the day" value={fmt(totals.trucksDay)} />
                <StatCard icon={<Truck />} label="Cumulative trucks out" value={fmt(cumulative.trucks)} />
                <StatCard icon={<Droplets />} label="Total quantity for the day" value={fmt(totals.qtyDay)} />
                <StatCard icon={<Droplets />} label="Cumulative quantity" value={fmt(cumulative.qty)} />
                </StatCardGrid>
                <section className={PANEL}>
                <div className={PANEL_RAIL}>
                <span className={MICRO}>Filters</span>
                </div>
                <div className={cn(PANEL_BODY, 'space-y-4')}>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                <label className={cn(MICRO, 'block text-muted-foreground')} htmlFor="from">Date from</label>
                <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                <label className={cn(MICRO, 'block text-muted-foreground')} htmlFor="to">Date to</label>
                <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                <label className={cn(MICRO, 'block text-muted-foreground')}>PFI</label>
                <NativeSelect value={pfi} onChange={(e) => setPfi(e.target.value)}>
                <option value={ALL}>All PFIs</option>
                {options.pfis.map((p) => <option key={p} value={p}>{p}</option>)}
                </NativeSelect>
                </div>
                <div className="space-y-1.5">
                <label className={cn(MICRO, 'block text-muted-foreground')}>Location</label>
                <NativeSelect value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value={ALL}>All locations</option>
                {options.locations.map((l) => <option key={l} value={l}>{l}</option>)}
                </NativeSelect>
                </div>
                </div>
                <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={build} disabled={isLoading || loadingRows}>
                {loadingRows && <Loader2 className="animate-spin" />}
                Run report
                </Button>
                <Button variant="outline" size="sm" onClick={exportExcel} disabled={!rows?.length || exporting !== null}>
                {exporting === 'excel' ? <Loader2 className="animate-spin" /> : <FileSpreadsheet data-icon="inline-start" />}
                Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportPdf} disabled={!rows?.length || exporting !== null}>
                {exporting === 'pdf' ? <Loader2 className="animate-spin" /> : <FileText data-icon="inline-start" />}
                PDF
                </Button>
                </div>
                </div>
                </section>
                <section className={PANEL}>
                <div className={PANEL_RAIL}>
                <span className={MICRO}>
                {rows ? `${fmt(rows.length)} truck${rows.length === 1 ? '' : 's'} cleared` : 'Trucks cleared'}
                </span>
                </div>
                {isLoading ? (
                <PageLoader message="Loading orders…" />
                ) : !rows ? (
                <PageEmpty title="Run the report" description="Choose a period and press Run report." />
                ) : rows.length === 0 ? (
                <PageEmpty title="No trucks cleared in that period" description="Widen the dates or clear a filter." />
                ) : (
                <div className="px-2 pb-2">
                <Table>
                <TableHeader>
                <TableRow>
                <TableHead className="w-12">S/N</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Truck No</TableHead>
                <TableHead>Order Ref</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Time of Exit</TableHead>
                <TableHead>Gantry</TableHead>
                <TableHead>Loader</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {rows.map((r, i) => (
                <TableRow key={r.id}>
                <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
                <TableCell className="tabular-nums">{r.date}</TableCell>
                <TableCell className="font-mono">{r.truckNumber}</TableCell>
                <TableCell className="font-normal text-accent">{r.orderRef}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(r.quantity)}</TableCell>
                <TableCell className="tabular-nums">{r.exitedAt}</TableCell>
                <TableCell>{r.gantry}</TableCell>
                <TableCell>{r.loader}</TableCell>
                </TableRow>
                ))}
                </TableBody>
                </Table>
                </div>
                )}
                </section>
                <DailyGateReport
                locations={options.locations}
                pfis={options.pfis}
                staffName={user ? `${user.firstName} ${user.surname}` : ''}
                outstanding={0}
                />
    </div>
  )
}

/**
 * The Daily Gate Report.
 *
 * Filled in by hand rather than derived — the officer's own count, signed off
 * at the end of a shift. Nothing here is written back to the system.
 */
function DailyGateReport({
  locations, pfis, staffName,
}: {
  locations: string[]
  pfis: string[]
  staffName: string
  outstanding: number
}) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [form, setForm] = useState({
    location: '', pfi: '', date: today,
    carriedOver: '', exitedToday: '', leftOver: '',
    staff: staffName, staffDate: today, remarks: '',
  })
  const [busy, setBusy] = useState(false)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const generate = async () => {
    setBusy(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ format: 'a4' })
      doc.setFontSize(15)
      doc.text('Soroman Energy — Daily Gate Report', 20, 22)
      doc.setFontSize(10)
      let y = 36
      const line = (label: string, value: string) => {
        doc.setTextColor(120)
        doc.text(label, 20, y)
        doc.setTextColor(0)
        doc.text(value || '—', 85, y)
        y += 9
      }
      line('Location', form.location)
      line('PFI', form.pfi)
      line('Date', form.date)
      y += 3
      line('Trucks carried over from yesterday', form.carriedOver)
      line('Trucks exited today', form.exitedToday)
      line('Trucks left over today', form.leftOver)
      y += 3
      line('Officer', form.staff)
      line('Date', form.staffDate)
      y += 5
      doc.setTextColor(120)
      doc.text('Remarks', 20, y); y += 7
      doc.setTextColor(0)
      doc.text(doc.splitTextToSize(form.remarks || '—', 170), 20, y)
      doc.save(`daily-gate-report_${form.date}.pdf`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={PANEL}>
      <div className={PANEL_RAIL}>
        <span className={MICRO}>Daily gate report</span>
        <span className="text-xs text-muted-foreground">Filled in by hand</span>
      </div>
      <div className={cn(PANEL_BODY, 'space-y-4')}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Location</label>
            <NativeSelect value={form.location} onChange={(e) => set('location', e.target.value)}>
              <option value="">Choose…</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>PFI</label>
            <NativeSelect value={form.pfi} onChange={(e) => set('pfi', e.target.value)}>
              <option value="">Choose…</option>
              {pfis.map((p) => <option key={p} value={p}>{p}</option>)}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Date</label>
            <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ['carriedOver', 'Carried over from yesterday'],
            ['exitedToday', 'Trucks exited today'],
            ['leftOver', 'Trucks left over today'],
          ] as const).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <label className={cn(MICRO, 'block text-muted-foreground')}>{label}</label>
              <Input
                type="number" inputMode="numeric" className="tabular-nums"
                value={form[key]} onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* These are the officer's own counts. The system knows how many trucks
            entered and have not exited, but the two are never reconciled — a
            disagreement is visible to a reader, not caught by the app. */}
        <p className="text-xs text-muted-foreground/70">
          These counts are typed by hand and are not reconciled against the truck
          records above.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Officer</label>
            <Input value={form.staff} onChange={(e) => set('staff', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Date</label>
            <Input type="date" value={form.staffDate} onChange={(e) => set('staffDate', e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={cn(MICRO, 'block text-muted-foreground')}>Remarks</label>
          <Textarea value={form.remarks} onChange={(e) => set('remarks', e.target.value)} rows={3} />
        </div>

        <Button onClick={generate} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <ClipboardList data-icon="inline-start" />}
          Generate gate report
        </Button>
      </div>
    </section>
  )
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
