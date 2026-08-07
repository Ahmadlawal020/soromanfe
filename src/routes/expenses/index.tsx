import { useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  Search, Plus, Receipt, Banknote, Building2, X, Trash2, Pencil, Download, Loader2,
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
  useExpenses, useExpenseCategories, useSaveExpense, useDeleteExpense,
  type PfiExpense, type ExpenseFilters,
} from '#/lib/hooks/usePfis'
import { naira } from '#/routes/pfi/-pfi-utils'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/expenses/')({
  beforeLoad: () => routeGuard('/expenses'),
  component: ExpensesPage,
})

const BLANK = {
  expense_date: format(new Date(), 'yyyy-MM-dd'),
  category_id: '',
  vendor: '',
  description: '',
  amount: '',
  bank_paid_from: '',
}

/**
 * The six-field form.
 *
 * The category dropdown is the important control: choosing a PFI-backed
 * category is what books the line against that batch. Nothing else on this
 * form mentions a PFI, and the field is deliberately not offered — the link
 * is derived server-side from the category alone.
 */
function ExpenseDialog({
  expense, open, onOpenChange,
}: {
  expense: PfiExpense | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { data: cats } = useExpenseCategories()
  const save = useSaveExpense()

  const seed = expense
    ? {
        expense_date: String(expense.expense_date).slice(0, 10),
        category_id: String(expense.category_id),
        vendor: expense.vendor || '',
        description: expense.description || '',
        amount: String(Number(expense.amount)),
        bank_paid_from: expense.bank_paid_from || '',
      }
    : BLANK

  const [form, setForm] = useState(seed)
  const key = expense?.id ?? 'new'
  const [seeded, setSeeded] = useState(key)
  if (seeded !== key) {
    setSeeded(key)
    setForm(seed)
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const ready = form.category_id && Number(form.amount) > 0

  const chosen = cats?.categories.find((c) => String(c.id) === form.category_id)

  const submit = async () => {
    await save.mutateAsync({
      id: expense?.id,
      data: { ...form, amount: Number(form.amount), category_id: Number(form.category_id) },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit expense' : 'Record an expense'}</DialogTitle>
          <DialogDescription>
            Choosing a PFI category books this line against that batch.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Date</label>
            <Input type="date" value={form.expense_date} onChange={(e) => set('expense_date', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Amount</label>
            <Input
              type="number" placeholder="0.00" value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Category</label>
            <NativeSelect value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
              <option value="">Select a category…</option>
              <optgroup label="General Categories">
                {cats?.general.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </optgroup>
              <optgroup label="PFIs">
                {cats?.pfi.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.pfi_status === 'finished' ? ' (finished)' : ''}
                  </option>
                ))}
              </optgroup>
            </NativeSelect>
            {chosen && (
              <p className="text-xs leading-tight text-muted-foreground/70">
                {chosen.pfi_id
                  ? 'Books against this PFI and rolls into its total expenses.'
                  : 'General overhead — not attached to any batch.'}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Vendor</label>
            <Input value={form.vendor} onChange={(e) => set('vendor', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Bank paid from</label>
            <Input value={form.bank_paid_from} onChange={(e) => set('bank_paid_from', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className={cn(MICRO, 'block text-muted-foreground')}>Description</label>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!ready || save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {expense ? 'Save changes' : 'Record expense'}
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

  const { data, isLoading, isError, error, refetch } = useExpenses(filters)
  const { data: cats } = useExpenseCategories()
  const remove = useDeleteExpense()

  const rows = data?.expenses || []
  const totals = data?.totals
  const hasFilters = Object.values(filters).some(Boolean)

  const set = (k: keyof ExpenseFilters, v: string) =>
    setFilters((f) => ({ ...f, [k]: v || undefined }))

  const exportCsv = () => {
    const head = ['Date', 'Category', 'PFI', 'Vendor', 'Description', 'Bank', 'Entered by', 'Amount']
    const body = rows.map((e) => [
      format(new Date(e.expense_date), 'yyyy-MM-dd'),
      e.category_name,
      e.pfi_number || '',
      e.vendor,
      e.description,
      e.bank_paid_from,
      e.entered_by,
      Number(e.amount).toFixed(2),
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

      <StatCardGrid count={3}>
        <StatCard
          icon={<Receipt />} label="Total spend" value={naira(totals?.total ?? 0, { compact: true })}
          description={`${totals?.count ?? 0} line${totals?.count === 1 ? '' : 's'} in view`}
        />
        <StatCard
          icon={<Banknote />} label="PFI spend" value={naira(totals?.pfiTotal ?? 0, { compact: true })}
          description="Attached to a cargo batch"
        />
        <StatCard
          icon={<Building2 />} label="General spend" value={naira(totals?.generalTotal ?? 0, { compact: true })}
          tone="neutral" description="Overhead, not attached to a batch"
        />
      </StatCardGrid>

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
        <NativeSelect className="w-48" value={filters.category || ''} onChange={(e) => set('category', e.target.value)}>
        <option value="">All categories</option>
        <optgroup label="General Categories">
        {cats?.general.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </optgroup>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Vendor</TableHead>
                  <TableHead className="hidden lg:table-cell">Bank</TableHead>
                  <TableHead className="hidden lg:table-cell">Entered by</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(e.expense_date), 'd MMM yyyy')}
                    </TableCell>
                    <TableCell className="max-w-[18rem] truncate">{e.description || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={e.pfi_id ? 'default' : 'secondary'} className="max-w-[14rem] truncate">
                        {e.category_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{e.vendor || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{e.bank_paid_from || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">{e.entered_by || '—'}</TableCell>
                    <TableCell className="text-right font-normal">{naira(Number(e.amount))}</TableCell>
                    <TableCell className="text-right">
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
            {rows.length} line{rows.length === 1 ? '' : 's'} · deletes are soft, so figures stay auditable
          </p>
        )}
      </div>

      <ExpenseDialog expense={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
