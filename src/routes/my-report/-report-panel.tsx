import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Loader2, Trash2, Pencil, Download, X } from 'lucide-react'

import api from '#/lib/api/http'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '#/components/ui/table'
import { PageEmpty } from '#/components/PageEmpty'
import { MICRO, PANEL, PANEL_RAIL } from '#/lib/panel'
import { cn, getErrorMessage } from '#/lib/utils'
import { useToast } from '#/lib/hooks/useToast'
import { naira } from '#/routes/pfi/-pfi-utils'
import { NativeSelect } from '#/components/ui/native-select'
import { usePfiList } from '#/lib/hooks/usePfis'
import type { ReportDef, FieldDef } from './-report-config'

const PAGE_SIZE = 10

const money = (v: unknown) => naira(Number(v ?? 0))
const num = (v: unknown) => Number(v ?? 0).toLocaleString()

/** Empty string rather than 0, so an untouched number field stays blank. */
const blankForm = (def: ReportDef) => {
  const out: Record<string, string> = {
    reportDate: format(new Date(), 'yyyy-MM-dd'),
    location: '',
    pfiNumber: '',
  }
  for (const s of def.sections) for (const f of s.fields) out[f.key] = ''
  return out
}

function Field({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  return (
    <div className={cn('space-y-1.5', field.full && 'sm:col-span-2')}>
      <Label htmlFor={field.key}>{field.label}</Label>
      {field.type === 'textarea' ? (
        <Textarea id={field.key} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input
          id={field.key}
          type={field.type === 'number' || field.type === 'money' ? 'number' : 'text'}
          inputMode={field.type === 'number' || field.type === 'money' ? 'numeric' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.hint && <p className="text-xs text-muted-foreground/70">{field.hint}</p>}
    </div>
  )
}

export function ReportPanel({ def }: { def: ReportDef }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [form, setForm] = useState(() => blankForm(def))
  const [editingId, setEditingId] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  // Only active batches can be reported against, and every PFI carries its
  // own location — so location is derived from the pick rather than typed,
  // which is what kept the two disagreeing.
  const { data: pfiData } = usePfiList({ status: 'active', limit: 200 })
  const activePfis = (pfiData?.pfis ?? []) as Array<{
    id: number; pfiNumber: string; locationName?: string
  }>

  // Filtered by type in SQL and paged by the server — one page number, not the
  // two the upstream version used, which skipped records on every "next".
  const { data, isLoading } = useQuery({
    queryKey: ['daily-reports', def.type, page],
    queryFn: async () => {
      const res = await api.get('/daily-reports', {
        params: { reportType: def.type, page, limit: PAGE_SIZE },
      })
      return res.data.data as { reports: any[]; pagination?: { total: number; pages?: number } }
    },
  })

  const rows = data?.reports ?? []
  const total = data?.pagination?.total ?? rows.length
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const reset = () => { setForm(blankForm(def)); setEditingId(null) }

  const save = useMutation({
    retry: false,
    mutationFn: async () => {
      const payload: Record<string, unknown> = { reportType: def.type }
      for (const [k, v] of Object.entries(form)) {
        if (v === '') continue
        const isNumeric = def.sections
          .flatMap((s) => s.fields)
          .some((f) => f.key === k && (f.type === 'number' || f.type === 'money'))
        payload[k] = isNumeric ? Number(v) : v
      }
      return editingId
        ? (await api.patch(`/daily-reports/${editingId}`, payload)).data
        : (await api.post('/daily-reports', payload)).data
    },
    onSuccess: (res) => {
      toast.success(res?.message || (editingId ? 'Report updated' : 'Report submitted'))
      qc.invalidateQueries({ queryKey: ['daily-reports', def.type] })
      reset()
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const remove = useMutation({
    retry: false,
    mutationFn: async (id: number) => (await api.delete(`/daily-reports/${id}`)).data,
    onSuccess: () => {
      toast.success('Report deleted')
      qc.invalidateQueries({ queryKey: ['daily-reports', def.type] })
      setConfirmDelete(null)
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const edit = (r: any) => {
    const next = blankForm(def)
    next.reportDate = String(r.reportDate ?? '').slice(0, 10)
    next.location = r.location ?? ''
    next.pfiNumber = r.pfiNumber ?? ''
    for (const s of def.sections) {
      for (const f of s.fields) next[f.key] = r[f.key] == null ? '' : String(r[f.key])
    }
    setForm(next)
    setEditingId(r.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /**
   * Download is a separate action, not a side effect of saving.
   *
   * Upstream every submit *and every edit* silently dropped a PDF into the
   * user's downloads, so correcting a typo left a second file behind.
   */
  const download = async (r: any) => {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF()

    doc.setFillColor(0, 86, 60)
    doc.rect(0, 0, 210, 26, 'F')
    doc.setTextColor(255).setFontSize(13)
    doc.text('SOROMAN ENERGY LIMITED', 14, 12)
    doc.setFontSize(9).text(def.pdfTitle.toUpperCase(), 14, 19)

    doc.setTextColor(0).setFontSize(9)
    doc.text(`Generated ${format(new Date(), 'd MMM yyyy, HH:mm')}`, 14, 34)

    const body: string[][] = [
      ['Date', r.reportDate ? format(new Date(r.reportDate), 'd MMM yyyy') : '—'],
      ['Location', r.location || '—'],
      ['PFI', r.pfiNumber || '—'],
      ['Submitted by', r.submittedByName || '—'],
    ]
    for (const s of def.sections) {
      for (const f of s.fields) {
        const v = r[f.key]
        if (v == null || v === '') continue
        body.push([f.label, f.type === 'money' ? money(v) : String(v)])
      }
    }

    autoTable(doc, { startY: 40, body, styles: { fontSize: 9, cellPadding: 2.5 } })
    const stamp = r.reportDate ? format(new Date(r.reportDate), 'yyyyMMdd') : 'report'
    doc.save(`${def.filePrefix}_${(r.location || 'ALL').replace(/\s+/g, '')}_${stamp}.pdf`)
  }

  const ready = form.location.trim() !== '' && form.reportDate !== ''

  return (
    <div className="space-y-6">
      <section className={PANEL}>
        <div className={PANEL_RAIL}>
          <span className={cn(MICRO, 'text-muted-foreground')}>
            {editingId ? 'Editing report' : def.title}
          </span>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X data-icon="inline-start" />
              Cancel edit
            </Button>
          )}
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="reportDate">Date</Label>
              <Input
                id="reportDate" type="date" value={form.reportDate}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setForm((f) => ({ ...f, reportDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pfiNumber">PFI</Label>
              <NativeSelect
                id="pfiNumber"
                value={form.pfiNumber}
                onChange={(e) => {
                  const picked = activePfis.find((p) => p.pfiNumber === e.target.value)
                  setForm((f) => ({
                    ...f,
                    pfiNumber: e.target.value,
                    // A PFI always has a location, so filling it by hand only
                    // creates a second answer that can disagree.
                    location: picked?.locationName || f.location,
                  }))
                }}
              >
                <option value="">Select an active PFI…</option>
                {activePfis.map((p) => (
                  <option key={p.id} value={p.pfiNumber}>{p.pfiNumber}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                readOnly={!!form.pfiNumber}
                placeholder="Choose a PFI, or type it"
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground/70">
                {form.pfiNumber ? "From the PFI." : 'Filled in when you pick a PFI.'}
              </p>
            </div>
          </div>

          {def.sections.map((section) => (
            <div key={section.label} className="space-y-3">
              <p className={cn(MICRO, 'border-b border-foreground/10 pb-2 text-muted-foreground')}>
                {section.label}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {section.fields.map((f) => (
                  <Field
                    key={f.key}
                    field={f}
                    value={form[f.key] ?? ''}
                    onChange={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 border-t border-foreground/10 pt-4">
            {!ready && (
              <p className="mr-auto text-xs text-muted-foreground">
                A date and location are needed before this can be filed.
              </p>
            )}
            <Button disabled={!ready || save.isPending} onClick={() => save.mutate()}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {editingId ? 'Save changes' : 'Submit report'}
            </Button>
          </div>
        </div>
      </section>

      <section className={PANEL}>
        <div className={PANEL_RAIL}>
          <span className={cn(MICRO, 'text-muted-foreground')}>Your submissions</span>
          {total > 0 && <span className="text-sm text-muted-foreground">{total} filed</span>}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : rows.length === 0 ? (
          <PageEmpty title="No reports submitted yet" description="Fill the form above to file your first one." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="hidden md:table-cell">PFI</TableHead>
                  {def.columns.map((c) => (
                    <TableHead key={c.key} className={c.align === 'right' ? 'text-right' : undefined}>
                      {c.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {r.reportDate ? format(new Date(r.reportDate), 'd MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell>{r.location || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {r.pfiNumber || '—'}
                    </TableCell>
                    {def.columns.map((c) => (
                      <TableCell key={c.key} className={c.align === 'right' ? 'text-right' : undefined}>
                        {c.money ? money(r[c.key]) : num(r[c.key])}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      {confirmDelete === r.id ? (
                        <span className="inline-flex items-center gap-2 text-xs">
                          Delete?
                          <button
                            className="text-destructive hover:underline"
                            onClick={() => remove.mutate(r.id)}
                          >
                            Yes
                          </button>
                          <button className="hover:underline" onClick={() => setConfirmDelete(null)}>
                            No
                          </button>
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon-sm" title="Edit" onClick={() => edit(r)}>
                            <Pencil /><span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon-sm" title="Download PDF" onClick={() => download(r)}>
                            <Download /><span className="sr-only">Download</span>
                          </Button>
                          <Button
                            variant="ghost" size="icon-sm" title="Delete"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setConfirmDelete(r.id)}
                          >
                            <Trash2 /><span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Hidden entirely on a single page, rather than showing a dead pager. */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-foreground/10 p-3">
            <span className="text-xs text-muted-foreground">
              Page {page} of {pages} · {total} reports
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
