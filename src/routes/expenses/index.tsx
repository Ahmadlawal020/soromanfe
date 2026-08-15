import { useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  Search, Plus, Receipt, Banknote, Building2, Hourglass, ListTree, X, Trash2, Pencil, Download, Loader2,
} from 'lucide-react'

import { StatCard, StatCardGrid } from '#/components/ui/stat-card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { NativeSelect } from '#/components/ui/native-select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#/components/ui/dialog'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { FilterBar } from '#/components/FilterBar'
import { MICRO, PANEL } from '#/lib/panel'
import { cn, getErrorMessage } from '#/lib/utils'
import {
  useExpenses, useExpenseCategories, useSaveExpense, useDeleteExpense, usePfiList,
  useAttachFiles,
  type PfiExpense, type ExpenseFilters, type GlGroup,
} from '#/lib/hooks/usePfis'
import { useCreateVendor } from '#/lib/hooks/useVendors'
import { VendorField, type VendorFieldValue } from '#/components/VendorField'
import { PendingAttachments, ExpenseAttachments, type PendingFile } from '#/components/ExpenseAttachments'
import { ExpenseReviewDrawer, StepBadge } from '#/components/ExpenseReviewDrawer'
import { GlAccountsDialog } from '#/components/GlAccountsDialog'
import { useCanManageChart } from '#/lib/hooks/useCanManageChart'
import { naira } from '#/routes/pfi/-pfi-utils'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/expenses/')({
  beforeLoad: () => routeGuard('/expenses'),
  component: ExpensesPage,
})

const BLANK = {
  expense_date: format(new Date(), 'yyyy-MM-dd'),
  gl_group: '',
  category_id: '',
  pfi_id: '',
  vendor: '',
  vendor_id: '',
  tin_number: '',
  invoice_number: '',
  description: '',
  amount: '',
  amount_ex_vat: '',
  vat_amount: '',
  invoice_amount: '',
  // The rate drives the deduction. Empty means the amount was typed by hand.
  wht_rate: '',
  wht_deduction: '',
  receipt_reference: '',
  // Where the money is going. Captured up front so an approver can see the
  // destination account before authorising rather than after.
  payee_bank_name: '',
  bank_code: '',
  payee_account_number: '',
  payee_account_name: '',
}

/** A blank money field stays blank on the wire — never 0. */
const num = (v: string) => (v.trim() === '' ? null : Number(v))
const show = (v: string | null | undefined) =>
  v === null || v === undefined || v === '' ? '' : String(Number(v))

/**
 * A schedule figure for the screen. Blank stays blank throughout: "no invoice
 * was raised" and "an invoice worth nothing" are different facts, and so are
 * "not yet paid" and "paid nothing".
 */
const cash = (v: string | null | undefined) =>
  v === null || v === undefined || v === '' ? '' : naira(Number(v))

/** The same figure for the CSV, unformatted so a spreadsheet reads it as money. */
const plain = (v: string | null | undefined) =>
  v === null || v === undefined || v === '' ? '' : Number(v).toFixed(2)

/**
 * The form, in three parts: which account the cost is posted to, the invoice
 * behind it, and where the money goes.
 *
 * The account is picked in two steps — group, then GL account — because the
 * chart is 46 accounts deep and a single flat list of them is unreadable. Only
 * the PFI group asks which cargo; every other group books to overhead, and
 * naming a cargo there would quietly inflate that batch's landed cost.
 */
function ExpenseDialog({
  expense, open, onOpenChange,
}: {
  expense: PfiExpense | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { data: cats } = useExpenseCategories()
  const { data: pfiList } = usePfiList({ limit: 200 })
  const save = useSaveExpense()
  const attach = useAttachFiles()
  const createVendor = useCreateVendor()
  /** Files uploaded before the request exists; registered once it does. */
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  // A freshly-typed vendor is offered for saving by default; an old row's
  // legacy free-text vendor is not — otherwise merely opening it for an
  // unrelated edit would quietly create a vendor record.
  const [saveNewVendor, setSaveNewVendor] = useState(!expense)

  const seed = expense
    ? {
        expense_date: String(expense.expense_date).slice(0, 10),
        // A row with no group predates the chart; 'legacy' selects the
        // stand-in group built below so it still edits.
        gl_group: expense.gl_group || 'legacy',
        category_id: String(expense.category_id),
        pfi_id: expense.pfi_id ? String(expense.pfi_id) : '',
        vendor: expense.vendor || '',
        vendor_id: expense.vendor_id ? String(expense.vendor_id) : '',
        tin_number: expense.tin_number || '',
        invoice_number: expense.invoice_number || '',
        description: expense.description || '',
        amount: String(Number(expense.amount)),
        amount_ex_vat: show(expense.amount_ex_vat),
        vat_amount: show(expense.vat_amount),
        invoice_amount: show(expense.invoice_amount),
        wht_rate: show(expense.wht_rate),
        wht_deduction: show(expense.wht_deduction),
        receipt_reference: expense.receipt_reference || '',
        payee_bank_name: expense.payee_bank_name || '',
        bank_code: expense.bank_code || '',
        payee_account_number: expense.payee_account_number || '',
        payee_account_name: expense.payee_account_name || '',
      }
    : BLANK

  const [form, setForm] = useState(seed)
  const key = expense?.id ?? 'new'
  const [seeded, setSeeded] = useState(key)
  if (seeded !== key) {
    setSeeded(key)
    setForm(seed)
    setPendingFiles([])
    setSaveNewVendor(!expense)
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const vatRate = cats?.vat_rate ?? 0.075
  const whtRates = cats?.wht_rates?.length ? cats.wht_rates : [0, 2, 2.5, 5, 10]
  // Income accounts are seeded for a complete chart but are not expenses, so
  // the form never offers them.
  const chartGroups = (cats?.groups || []).filter((g) => !g.isIncome)

  /**
   * An API that predates the chart returns categories but no groups, and the
   * picker would then offer nothing at all — the one failure people cannot work
   * around. Fall back to the flat split the old endpoint always sent.
   */
  const groups: GlGroup[] =
    chartGroups.length > 0
      ? chartGroups
      : ([
          cats?.general?.length && {
            code: 'administrative',
            label: 'General categories',
            hint: 'From an older server — no GL codes on these yet.',
            accounts: cats.general,
            subgroups: [{ label: '', accounts: cats.general }],
          },
          cats?.pfi?.length && {
            code: 'pfi_direct',
            label: 'PFIs',
            hint: 'Books against the batch the category names.',
            accounts: cats.pfi,
            subgroups: [{ label: '', accounts: cats.pfi }],
          },
        ].filter(Boolean) as GlGroup[])

  const chosen = cats?.categories.find((c) => String(c.id) === form.category_id)

  /**
   * A one-account stand-in for a line booked before the chart existed. Without
   * it the account dropdown would come up empty on those rows and any edit —
   * correcting an amount, say — would silently re-file the cost.
   */
  const legacy =
    chosen && !chosen.gl_group
      ? {
          code: 'legacy',
          label: chosen.pfi_id ? `Cargo · ${chosen.name}` : `Uncategorised · ${chosen.name}`,
          hint: 'Recorded before the chart of accounts. Pick a GL account above to file it properly.',
          requiresPfi: false,
          accounts: [chosen],
          subgroups: [{ label: '', accounts: [chosen] }],
        }
      : null

  const group = form.gl_group === 'legacy' ? legacy : groups.find((g) => g.code === form.gl_group)

  /**
   * The invoice arithmetic, run forward from whatever was just edited:
   *
   *   ex-VAT → VAT (7.5%) → invoice (their sum) → WHT (rate × ex-VAT)
   *          → amount requested (invoice − WHT)
   *
   * Only the fields downstream of the edit are rewritten, so a VAT or an
   * invoice total typed by hand is never overwritten from underneath — plenty
   * of vendors charge no VAT, and an invoice does not always add up the way the
   * arithmetic says it should.
   *
   * Withholding is taken on the ex-VAT value, never on the VAT-inclusive total.
   */
  const round = (n: number) => Math.round(n * 100) / 100

  const apply = (patch: Partial<typeof BLANK>) =>
    setForm((f) => {
      const next = { ...f, ...patch }
      const ex = num(next.amount_ex_vat)

      if (ex !== null && patch.amount_ex_vat !== undefined) {
        next.vat_amount = String(round(ex * vatRate))
      }
      if (ex !== null && (patch.amount_ex_vat !== undefined || patch.vat_amount !== undefined)) {
        next.invoice_amount = String(round(ex + (num(next.vat_amount) || 0)))
      }
      // A chosen rate always drives the deduction; typing the amount by hand
      // clears the rate, because then no rate produced it.
      if (ex !== null && next.wht_rate !== '') {
        next.wht_deduction = String(round(ex * (Number(next.wht_rate) / 100)))
      }

      const invoice = num(next.invoice_amount)
      if (invoice !== null) next.amount = String(round(invoice - (num(next.wht_deduction) || 0)))
      return next
    })

  /** Changing the group invalidates the account under it, and any cargo with it. */
  const setGroup = (code: string) =>
    setForm((f) => ({ ...f, gl_group: code, category_id: '', pfi_id: '' }))

  const needsPfi = !!group?.requiresPfi
  const ready = form.category_id && Number(form.amount) > 0 && (!needsPfi || !!form.pfi_id)

  const submit = async () => {
    // A vendor picked from the list already carries an id; a freshly-typed
    // one is saved first (if asked to) so this request can link to it too.
    let vendorId = form.vendor_id ? Number(form.vendor_id) : null
    if (!vendorId && form.vendor.trim() && saveNewVendor) {
      try {
        const savedVendor = await createVendor.mutateAsync({ name: form.vendor.trim() })
        vendorId = savedVendor?.id ? Number(savedVendor.id) : null
      } catch {
        // The vendor failed to save — the request still goes through under
        // the typed name; nothing here should block raising it.
      }
    }

    const saved = await save.mutateAsync({
      id: expense?.id,
      data: {
        ...form,
        vendor_id: vendorId,
        amount: Number(form.amount),
        category_id: Number(form.category_id),
        // Only the direct-cost group carries a cargo; the server refuses one
        // anywhere else, so send null rather than a stale id.
        pfi_id: needsPfi && form.pfi_id ? Number(form.pfi_id) : null,
        amount_ex_vat: num(form.amount_ex_vat),
        vat_amount: num(form.vat_amount),
        invoice_amount: num(form.invoice_amount),
        wht_deduction: num(form.wht_deduction) ?? 0,
        wht_rate: num(form.wht_rate),
      },
    })

    // Files chosen before the request existed are registered against it now.
    // A failure here is reported but does not un-raise the request — the
    // paperwork can be re-attached, a lost request cannot be un-lost.
    const newId = saved?.data?.expense?.id ?? expense?.id
    if (pendingFiles.length > 0 && newId) {
      await attach.mutateAsync({ id: Number(newId), files: pendingFiles }).catch(() => {})
      setPendingFiles([])
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit request' : 'Raise a payment request'}</DialogTitle>
          <DialogDescription>
            The GL account decides where this lands in the books. It goes to the
            Expenditure Officer, then the CFO, then final approval.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Expense category</label>
            <NativeSelect value={form.gl_group} onChange={(e) => setGroup(e.target.value)}>
              <option value="">Select a category…</option>
              {groups.map((g) => <option key={g.code} value={g.code}>{g.label}</option>)}
              {/* Offered only while editing a line that predates the chart, so
                  it stays editable without being re-filed by accident. */}
              {legacy && <option value="legacy">{legacy.label}</option>}
            </NativeSelect>
            {group && (
              <p className="text-xs leading-tight text-muted-foreground/70">{group.hint}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn(MICRO, 'block text-muted-foreground')}>GL account</label>
            <NativeSelect
              value={form.category_id}
              disabled={!group}
              onChange={(e) => set('category_id', e.target.value)}
            >
              <option value="">{group ? 'Select an account…' : 'Pick a category first'}</option>
              {group?.subgroups.map((sub) =>
                sub.label ? (
                  <optgroup key={sub.label} label={sub.label}>
                    {sub.accounts.map((c) => (
                      <option key={c.id} value={c.id}>{c.gl_code} · {c.name}</option>
                    ))}
                  </optgroup>
                ) : (
                  sub.accounts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.gl_code ? `${c.gl_code} · ` : ''}{c.name}
                    </option>
                  ))
                ),
              )}
            </NativeSelect>
          </div>

          {needsPfi && (
            <div className="space-y-1.5 sm:col-span-2">
              <label className={cn(MICRO, 'block text-muted-foreground')}>PFI</label>
              <NativeSelect value={form.pfi_id} onChange={(e) => set('pfi_id', e.target.value)}>
                <option value="">Select the cargo this cost belongs to…</option>
                {(pfiList?.pfis || []).map((p) => (
                  <option key={String(p.id)} value={String(p.id)}>
                    {p.pfiNumber}{p.status === 'finished' ? ' (finished)' : ''}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-xs leading-tight text-muted-foreground/70">
                Rolls into this batch's total expenses once the request is paid.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Date</label>
            <Input type="date" value={form.expense_date} onChange={(e) => set('expense_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Vendor</label>
            <VendorField
              value={{ vendor: form.vendor, vendor_id: form.vendor_id, saveNew: saveNewVendor }}
              onChange={(v: VendorFieldValue) => {
                setForm((f) => ({ ...f, vendor: v.vendor, vendor_id: v.vendor_id }))
                setSaveNewVendor(v.saveNew)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>TIN number</label>
            <Input value={form.tin_number} onChange={(e) => set('tin_number', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Invoice no.</label>
            <Input value={form.invoice_number} onChange={(e) => set('invoice_number', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Purpose</label>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>

          {/* The invoice. Every field stays editable after it is filled in —
              plenty of vendors charge no VAT, and a part payment has to be
              recordable — so these compute forward, not in a locked loop. */}
          <div className="space-y-1.5 sm:col-span-2">
            <p className={cn(MICRO, 'border-b border-foreground/10 pb-2 text-muted-foreground')}>
              Invoice
            </p>
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Amount ex VAT</label>
            <Input
              type="number" placeholder="0.00" value={form.amount_ex_vat}
              onChange={(e) => apply({ amount_ex_vat: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>
              VAT ({(vatRate * 100).toFixed(1)}%)
            </label>
            <Input
              type="number" placeholder="0.00" value={form.vat_amount}
              onChange={(e) => apply({ vat_amount: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Invoice amount</label>
            <Input
              type="number" placeholder="0.00" value={form.invoice_amount}
              onChange={(e) => apply({ invoice_amount: e.target.value })}
            />
          </div>

          {/* Rate first, amount second. Which rate an invoice attracts is
              Finance's call, so the options are bare percentages — this app
              does not guess the transaction type on their behalf. */}
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>WHT rate</label>
            <NativeSelect
              value={form.wht_rate}
              onChange={(e) => apply({ wht_rate: e.target.value })}
            >
              <option value="">Enter amount manually</option>
              {whtRates.map((r) => (
                <option key={r} value={String(r)}>{r === 0 ? 'No WHT (0%)' : `${r}%`}</option>
              ))}
            </NativeSelect>
            <p className="text-xs leading-tight text-muted-foreground/70">
              Taken on the ex-VAT amount.
            </p>
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>WHT deduction</label>
            <Input
              type="number" placeholder="0.00" value={form.wht_deduction}
              onChange={(e) => apply({ wht_deduction: e.target.value, wht_rate: '' })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Amount requested</label>
            <Input
              type="number" placeholder="0.00" value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
            />
            <p className="text-xs leading-tight text-muted-foreground/70">
              Invoice amount less WHT. What actually gets paid is recorded by the
              Expenditure Officer at the end.
            </p>
          </div>

          {/* Read-only: the pair belongs to the account, and typing it by hand
              is how a schedule ends up with a code that names nothing. */}
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>GL code</label>
            <Input readOnly value={chosen?.gl_code || ''} placeholder="—" className="bg-muted/40" />
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>GL name</label>
            <Input readOnly value={chosen?.name || ''} placeholder="—" className="bg-muted/40" />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <p className={cn(MICRO, 'border-b border-foreground/10 pb-2 text-muted-foreground')}>
              Pay to
            </p>
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Account name</label>
            <Input value={form.payee_account_name} onChange={(e) => set('payee_account_name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Account number</label>
            <Input value={form.payee_account_number} onChange={(e) => set('payee_account_number', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Bank code</label>
            <Input value={form.bank_code} onChange={(e) => set('bank_code', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Bank name</label>
            <Input value={form.payee_bank_name} onChange={(e) => set('payee_bank_name', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Receipt reference</label>
            <Input value={form.receipt_reference} onChange={(e) => set('receipt_reference', e.target.value)} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <p className={cn(MICRO, 'border-b border-foreground/10 pb-2 text-muted-foreground')}>
              Supporting documents
            </p>
          </div>
          <div className="sm:col-span-2">
            {/* On an existing request files register straight away; on a new one
                they wait for the id that submitting creates. */}
            {expense ? (
              <ExpenseAttachments expenseId={expense.id} />
            ) : (
              <PendingAttachments files={pendingFiles} onChange={setPendingFiles} />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!ready || save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {expense ? 'Save and resubmit' : 'Submit request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExpensesPage() {
  const [filters, setFilters] = useState<ExpenseFilters>({})
  const [editing, setEditing] = useState<PfiExpense | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [reviewing, setReviewing] = useState<number | null>(null)
  const [chartOpen, setChartOpen] = useState(false)
  const canManageChart = useCanManageChart()

  const { data, isLoading, isError, error, refetch } = useExpenses(filters)
  const { data: cats } = useExpenseCategories()
  const remove = useDeleteExpense()

  const rows = data?.expenses || []
  const totals = data?.totals
  const hasFilters = Object.values(filters).some(Boolean)
  const vatRate = cats?.vat_rate ?? 0.075

  const set = (k: keyof ExpenseFilters, v: string) =>
    setFilters((f) => ({ ...f, [k]: v || undefined }))

  /** The payment schedule, column for column — the same columns as the table. */
  const exportCsv = () => {
    const head = [
      'S/N', 'Reference', 'Date', 'Vendor', 'TIN NUMBER', 'Invoice No.', 'Purpose',
      'Amount-Ex VAT', `${(vatRate * 100).toFixed(1)}%`, 'Invoice Amount',
      'WHT rate %', 'WHT deduction', 'Amount requested', 'Amount paid',
      'GL code', 'GL Name', 'Bank code', 'Bank Name', 'Paid from',
      'PFI', 'Status',
    ]
    const body = rows.map((e, i) => [
      String(i + 1),
      e.reference_number || '',
      format(new Date(e.expense_date), 'yyyy-MM-dd'),
      e.vendor,
      e.tin_number || '',
      e.invoice_number || '',
      e.description,
      plain(e.amount_ex_vat),
      plain(e.vat_amount),
      plain(e.invoice_amount),
      e.wht_rate ? String(Number(e.wht_rate)) : '',
      plain(e.wht_deduction),
      Number(e.amount).toFixed(2),
      plain(e.amount_paid),
      e.gl_code || '',
      e.category_name,
      e.bank_code || '',
      e.payee_bank_name || '',
      e.bank_paid_from || '',
      e.pfi_number || '',
      e.status_label,
    ])
    const csv = [head, ...body]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openNew = () => { setEditing(null); setDialogOpen(true) }
  const openEdit = (e: PfiExpense) => { setEditing(e); setDialogOpen(true) }

  if (isLoading) return <PageLoader />
  if (isError) return <PageError message={getErrorMessage(error)} onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
      eyebrow="Finance"
      title="Expenses"
      description="Costs booked to a category. A PFI category is what attaches the line to a batch."
      actions={
        <>
          <div className="flex gap-2">
          {/* Only an administrator or the CFO can reshape the chart, and the
              server says so too — this just spares everyone else the door. */}
          {canManageChart && (
          <Button variant="outline" onClick={() => setChartOpen(true)}>
          <ListTree data-icon="inline-start" />
          GL accounts
          </Button>
          )}
          <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download data-icon="inline-start" />
          Export CSV
          </Button>
          <Button onClick={openNew}>
          <Plus data-icon="inline-start" />
          Record expense
          </Button>
          </div>
        </>
      }
    />

      {/* Awaiting payment stands on its own card. Folded into a total it is
          invisible, and it is the one figure whoever runs payments is after. */}
      <StatCardGrid count={4}>
        <StatCard
          icon={<Receipt />} label="Total Expenses" value={naira(totals?.total ?? 0, { compact: true })}
          // description={`${totals?.count ?? 0} line${totals?.count === 1 ? '' : 's'} in view`}
        />
        <StatCard
          icon={<Hourglass />} label="Awaiting Payment" value={naira(totals?.openTotal ?? 0, { compact: true })}
          // description="Approved or still walking the chain"
        />
        <StatCard
          icon={<Banknote />} label="PFI Expenses" value={naira(totals?.pfiTotal ?? 0, { compact: true })}
          // description="Attached to a cargo batch"
        />
        <StatCard
          icon={<Building2 />} label="Other Expenses" value={naira(totals?.generalTotal ?? 0, { compact: true })}
          // tone="neutral" description="Overhead, not attached to a batch"
        />
      </StatCardGrid>

      {/* Counts ignore the status filter, so a tab never reads zero just
          because you are standing inside another one. */}
      <div className="flex flex-wrap gap-1.5">
        {[
          // Named after whoever has to act next, in chain order.
          ['', 'All'], ['awaiting', 'Awaiting'], ['pending', 'With officer'],
          ['verified', 'With CFO'], ['audit_approved', 'Final approval'],
          ['admin_approved', 'To pay'], ['paid', 'Paid'], ['rejected', 'Rejected'],
        ].map(([value, label]) => {
          const active = (filters.status || '') === value
          const n = data?.statusCounts?.[value || 'all'] ?? 0
          return (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => setFilters((f) => ({ ...f, status: value || undefined }))}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm transition-colors duration-250 ease-luxe',
                active
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-foreground/15 text-muted-foreground hover:border-foreground/30',
              )}
            >
              {label}
              <span className="ml-1.5 opacity-60">{n}</span>
            </button>
          )
        })}
      </div>

      <FilterBar>
        <div className="relative min-w-[11rem] flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
        className="pl-8" placeholder="Search description, vendor, category…"
        value={filters.search || ''} onChange={(e) => set('search', e.target.value)}
        />
        </div>
        <NativeSelect className="w-36" value={filters.type || ''} onChange={(e) => set('type', e.target.value)}>
        <option value="">All spend</option>
        <option value="pfi">PFI only</option>
        <option value="general">General only</option>
        </NativeSelect>
        <NativeSelect className="w-44" value={filters.group || ''} onChange={(e) => set('group', e.target.value)}>
        <option value="">All categories</option>
        {(cats?.groups || []).map((g) => <option key={g.code} value={g.code}>{g.label}</option>)}
        </NativeSelect>
        {/* Accounts are listed under their group, in GL-code order. The legacy
            categories keep an optgroup of their own so older lines stay
            findable. */}
        <NativeSelect className="w-48" value={filters.category || ''} onChange={(e) => set('category', e.target.value)}>
        <option value="">All GL accounts</option>
        {(cats?.groups || []).map((g) => (
        <optgroup key={g.code} label={g.label}>
        {g.accounts.map((c) => <option key={c.id} value={c.id}>{c.gl_code} · {c.name}</option>)}
        </optgroup>
        ))}
        {cats?.unmapped?.length ? (
        <optgroup label="Pre-chart categories">
        {cats.unmapped.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
        ) : null}
        <optgroup label="PFIs">
        {cats?.pfi.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
        </NativeSelect>
        <NativeSelect className="w-36" value={filters.bank || ''} onChange={(e) => set('bank', e.target.value)}>
        <option value="">All banks</option>
        {data?.banks.map((b) => <option key={b} value={b}>{b}</option>)}
        </NativeSelect>
        <Input
        type="date" className="w-36" value={filters.dateFrom || ''}
        onChange={(e) => set('dateFrom', e.target.value)}
        />
        <Input
        type="date" className="w-36" value={filters.dateTo || ''}
        onChange={(e) => set('dateTo', e.target.value)}
        />
        {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
        <X data-icon="inline-start" />
        Clear
        </Button>
        )}
      </FilterBar>

      <div className={cn(PANEL)}>

        {rows.length === 0 ? (
          <PageEmpty
            icon={<Receipt />}
            title={hasFilters ? 'No expenses match those filters' : 'No expenses recorded'}
            description={hasFilters ? 'Try widening the search.' : 'Record one to get started.'}
          />
        ) : (
          /* The payment schedule itself, column for column, so what is on
             screen is what comes out of the export. It is deliberately wide —
             the table scrolls rather than dropping columns, because a schedule
             missing its TIN or GL code is not a schedule. */
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">S/N</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>TIN number</TableHead>
                  <TableHead>Invoice no.</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Amount ex VAT</TableHead>
                  <TableHead className="text-right">{(vatRate * 100).toFixed(1)}%</TableHead>
                  <TableHead className="text-right">Invoice amount</TableHead>
                  <TableHead className="text-right">WHT</TableHead>
                  <TableHead className="text-right">Requested</TableHead>
                  <TableHead className="text-right">Amount paid</TableHead>
                  <TableHead>GL code</TableHead>
                  <TableHead>GL name</TableHead>
                  <TableHead>Bank code</TableHead>
                  <TableHead>Bank name</TableHead>
                  <TableHead>Paid from</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e, i) => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => setReviewing(e.id)}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                      {e.reference_number || '—'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(e.expense_date), 'd MMM yyyy')}
                    </TableCell>
                    <TableCell className="max-w-[12rem] truncate">{e.vendor || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{e.tin_number || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{e.invoice_number || '—'}</TableCell>
                    <TableCell className="max-w-[16rem] truncate">{e.description || '—'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{cash(e.amount_ex_vat) || '—'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{cash(e.vat_amount) || '—'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{cash(e.invoice_amount) || '—'}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {cash(e.wht_deduction) || '—'}
                      {e.wht_rate ? (
                        <span className="ml-1 opacity-60">({Number(e.wht_rate)}%)</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">{naira(Number(e.amount))}</TableCell>
                    {/* Blank until it is settled — a request awaiting payment
                        has not paid ₦0. */}
                    <TableCell className="text-right whitespace-nowrap font-medium">
                      {cash(e.amount_paid) || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.gl_code || '—'}</TableCell>
                    <TableCell className="max-w-[14rem] truncate">
                      <Badge variant={e.pfi_id ? 'default' : 'secondary'} className="max-w-[13rem] truncate">
                        {e.category_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{e.bank_code || '—'}</TableCell>
                    <TableCell className="max-w-[10rem] truncate text-muted-foreground">
                      {e.payee_bank_name || '—'}
                    </TableCell>
                    <TableCell className="max-w-[10rem] truncate text-muted-foreground">
                      {e.bank_paid_from || '—'}
                    </TableCell>
                    <TableCell><StepBadge expense={e} /></TableCell>
                    <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(e)} title="Edit">
                          <Pencil /><span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost" size="icon-sm" title="Delete"
                          disabled={remove.isPending}
                          onClick={() => remove.mutate(e.id)}
                        >
                          <Trash2 /><span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {rows.length > 0 && (
          <p className={cn(MICRO, 'border-t border-foreground/10 p-3 text-muted-foreground')}>
            {rows.length} of {data?.pagination?.total ?? rows.length}
            {data?.scope === 'own' && ' · showing only requests you raised'}
            {' · only paid requests count toward a cargo\'s cost'}
          </p>
        )}
      </div>

      <ExpenseDialog expense={editing} open={dialogOpen} onOpenChange={setDialogOpen} />

      <GlAccountsDialog open={chartOpen} onOpenChange={setChartOpen} />

      <ExpenseReviewDrawer
        expenseId={reviewing}
        open={reviewing != null}
        onOpenChange={(o) => !o && setReviewing(null)}
        onEdit={(e) => { setEditing(e); setDialogOpen(true) }}
      />
    </div>
  )
}
