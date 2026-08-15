import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Landmark, User, DollarSign, Loader2, CheckCircle2, ShieldCheck, ArrowDownLeft, Hourglass, Search, Check } from 'lucide-react'
import { useCustomerList } from '#/lib/hooks/useCustomers'
import { useBankAccounts } from '#/lib/hooks/useBankAccounts'
import { useCreateDeposit } from '#/lib/hooks/useDeposits'
import { StatementLinePicker } from '#/components/StatementLinePicker'
import { type StatementLine } from '#/lib/hooks/useBankStatements'
import { useExpectedPayments, useResolveExpectedPayment } from '#/lib/hooks/useExpectedPayments'
import { MICRO, PANEL, PANEL_RAIL, PANEL_BODY, PANEL_FOOTER } from '#/lib/panel'
import { cn, toNum } from '#/lib/utils'
import type { Customer, } from '#/lib/types'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/deposits/manual-deposit')({
    beforeLoad: () => routeGuard('/deposits'),
    component: ManualDepositPage,
})

function formatCurrency(val: number) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(val)
}

/** Bank depositor names can run long — a hard character cap keeps every row the same shape regardless of panel width. */
const truncateText = (text: string, max = 50) =>
    text.length > max ? `${text.slice(0, max).trimEnd()}…` : text

/** A section's header rail — icon, title, one-line purpose. Shared shape across the three steps below. */
function SectionHeader({
    icon,
    tone,
    title,
    description,
}: {
    icon: React.ReactNode
    tone: string
    title: string
    description: string
}) {
    return (
        <div className={PANEL_RAIL}>
            <div className="flex items-center gap-3">
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4', tone)}>
                    {icon}
                </span>
                <div>
                    <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    )
}

function ManualDepositPage() {
    const navigate = useNavigate()
    const { data: customerData, isLoading: isLoadingCustomers } = useCustomerList({ limit: 500 })
    const { data: bankAccounts, isLoading: isLoadingBanks } = useBankAccounts({ status: 'Active' })
    const createDepositMutation = useCreateDeposit()
    const resolveExpectedPayment = useResolveExpectedPayment()
    // The statement row(s) this payment is being confirmed against, if any —
    // several when a customer transferred in more than one tranche.
    const [statementLines, setStatementLines] = useState<StatementLine[]>([])
    const [statementQuery, setStatementQuery] = useState('')
    // Which of the customer's pending expected-payment notes this deposit
    // settles, if any — purely advisory bookkeeping, resolved after the
    // deposit itself succeeds.
    const [resolvingExpectedId, setResolvingExpectedId] = useState<number | null>(null)

    const customersList: Customer[] = useMemo(() => {
        if (!customerData) return []
        return Array.isArray(customerData) ? customerData : (customerData as any)?.customers || []
    }, [customerData])

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
    // Open while no customer is picked yet, or while "Change" is reopening it.
    const [customerPickerOpen, setCustomerPickerOpen] = useState(true)
    const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('')
    const [selectedBankId, setSelectedBankId] = useState<string>('')
    const [amount, setAmount] = useState<string>('')
    const [depositorName, setDepositorName] = useState<string>('')
    const [paymentDate, setPaymentDate] = useState<string>(() => {
        const now = new Date()
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
        return now.toISOString().slice(0, 16)
    })
    const [reference, setReference] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const [errors, setErrors] = useState<Record<string, string>>({})

    const selectedCustomer = useMemo(() => {
        return customersList.find(
            (c) => String(c._id || (c as any).id) === String(selectedCustomerId)
        )
    }, [customersList, selectedCustomerId])

    const pickCustomer = (cust: Customer) => {
        setSelectedCustomerId(String(cust._id || (cust as any).id))
        setCustomerPickerOpen(false)
        setCustomerSearchTerm('')
        setResolvingExpectedId(null)
        setErrors((prev) => ({ ...prev, customer: '' }))
    }

    const customerIdForLookup = selectedCustomer ? (selectedCustomer._id || (selectedCustomer as any).id) : undefined
    const { data: pendingExpectedPayments = [] } = useExpectedPayments({ customerId: customerIdForLookup, status: 'pending' })

    const selectedBank = useMemo(() => {
        if (!bankAccounts) return undefined
        return bankAccounts.find((b) => String(b.id) === String(selectedBankId))
    }, [bankAccounts, selectedBankId])

    const filteredCustomers = useMemo(() => {
        if (!customerSearchTerm.trim()) return customersList.slice(0, 100)
        const term = customerSearchTerm.toLowerCase()
        return customersList
            .filter((c) => {
                const name = (c.name || '').toLowerCase()
                const company = (c.companyName || '').toLowerCase()
                const phone = (c.phone || '').toLowerCase()
                return name.includes(term) || company.includes(term) || phone.includes(term)
            })
            .slice(0, 100)
    }, [customersList, customerSearchTerm])

    const numAmount = useMemo(() => {
        const parsed = parseFloat(amount)
        return isNaN(parsed) || parsed < 0 ? 0 : parsed
    }, [amount])

    const currentBalance = useMemo(() => {
        if (!selectedCustomer) return 0
        return toNum(selectedCustomer.balance)
    }, [selectedCustomer])

    const newBalance = useMemo(() => {
        return currentBalance + numAmount
    }, [currentBalance, numAmount])

    const validateForm = () => {
        const errs: Record<string, string> = {}
        if (!selectedCustomerId) {
            errs.customer = 'Please select a customer'
        }
        if (!selectedBankId) {
            errs.bankAccount = 'Please select the receiving bank account'
        }
        if (!numAmount || numAmount <= 0) {
            errs.amount = 'Deposit amount must be greater than zero'
        }
        if (statementLines.length === 0 && !depositorName.trim()) {
            errs.depositorName = 'Payer/Depositor name is required'
        }
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    /** Recomputes the form from whichever statement rows are currently selected — sums the amount, joins depositor names/references, uses the latest date. */
    const applyStatementLines = (lines: StatementLine[]) => {
        if (lines.length === 0) return
        const total = lines.reduce((sum, l) => sum + Number(l.amount), 0)
        const depositors = [...new Set(lines.map((l) => l.depositor).filter(Boolean))]
        const refs = [...new Set(lines.map((l) => l.bank_ref).filter(Boolean))]
        const narrations = [...new Set(lines.map((l) => l.narration).filter(Boolean))]
        const latest = lines.reduce((max, l) => (new Date(l.txn_date) > new Date(max.txn_date) ? l : max), lines[0])

        // The date field is datetime-local, which needs YYYY-MM-DDTHH:mm in
        // local time — an ISO string would be rejected as out of format.
        const d = new Date(latest.txn_date)
        const pad = (n: number) => String(n).padStart(2, '0')
        const localDateTime =
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
            `T${pad(d.getHours())}:${pad(d.getMinutes())}`

        setAmount(String(total))
        setDepositorName(depositors.join(', '))
        setPaymentDate(localDateTime)
        setReference(refs.join(', '))
        if (narrations.length && !description.trim()) setDescription(narrations.join('; '))
        setErrors({})
    }

    const toggleStatementLine = (line: StatementLine) => {
        const exists = statementLines.some((l) => l.id === line.id)
        const next = exists ? statementLines.filter((l) => l.id !== line.id) : [...statementLines, line]
        setStatementLines(next)
        if (next.length > 0) applyStatementLines(next)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        if (!selectedCustomer || !selectedBank) return

        try {
            const res = await createDepositMutation.mutateAsync({
                customer: selectedCustomer._id || (selectedCustomer as any).id,
                // The server recomputes the total from the claimed lines itself
                // when lineIds is set — this is still sent for the plain-entry
                // path, and as a sanity display value either way.
                amount: numAmount,
                bankAccountId: selectedBank.id,
                bankName: selectedBank.bankName,
                accountName: selectedBank.accountName,
                accountNumber: selectedBank.accountNumber,
                depositorName: depositorName.trim(),
                paymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
                reference: reference.trim(),
                description: description.trim() || `Manual deposit into ${selectedBank.bankName} (${selectedBank.accountNumber}) by ${depositorName.trim()}`,
                lineIds: statementLines.length > 0 ? statementLines.map((l) => l.id) : undefined,
            })

            if (res?.success) {
                // Advisory only: link the expected-payment note to this deposit,
                // if the desk picked one. Never blocks the deposit that already
                // succeeded above.
                if (resolvingExpectedId) {
                    resolveExpectedPayment.mutate({ id: resolvingExpectedId, depositId: res?.data?.deposit?.id })
                }
                navigate({ to: '/deposits/' as any })
            }
        } catch {
            // Error handled by mutation toast
        }
    }

    const lockedByStatement = statementLines.length > 0

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-16">
            <PageHeader
                eyebrow="Finance"
                title="Record Manual Deposit"
                description="Register a direct bank transfer or teller deposit to a customer's account."
            />

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_360px] items-start gap-6">
                <div className="space-y-6">

                    {/* 1. Customer */}
                    <section className={PANEL}>
                        <SectionHeader
                            icon={<User />}
                            tone="bg-primary/10 text-primary"
                            title="Customer"
                            description="Whose account this deposit credits"
                        />
                        <div className={cn(PANEL_BODY, 'space-y-4')}>
                            {selectedCustomer && !customerPickerOpen ? (
                                <div className="space-y-3 rounded-xl border border-foreground/15 bg-muted/30 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground">{selectedCustomer.name}</p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {selectedCustomer.companyName ? `${selectedCustomer.companyName} • ` : ''}
                                                {selectedCustomer.phone || 'No phone'}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="shrink-0"
                                            onClick={() => setCustomerPickerOpen(true)}
                                        >
                                            Change
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-foreground/10 pt-3">
                                        <span className="text-xs text-muted-foreground uppercase">Current balance</span>
                                        <span className={cn('font-mono text-base font-semibold', currentBalance < 0 ? 'text-destructive' : 'text-foreground')}>
                                            {formatCurrency(currentBalance)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="customer-search" className={cn(MICRO, 'text-muted-foreground')}>
                                        Search customer *
                                    </Label>
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="customer-search"
                                            type="text"
                                            placeholder="Search by name, company, or phone…"
                                            value={customerSearchTerm}
                                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                            className={cn('pl-9', errors.customer && 'border-destructive')}
                                            autoFocus={customerPickerOpen && !!selectedCustomer}
                                        />
                                    </div>

                                    <ul className="max-h-64 divide-y divide-foreground/10 overflow-y-auto rounded-lg border border-foreground/15">
                                        {isLoadingCustomers ? (
                                            <li className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                                                <Loader2 className="size-4 animate-spin" /> Loading customers…
                                            </li>
                                        ) : filteredCustomers.length === 0 ? (
                                            <li className="py-8 text-center text-sm text-muted-foreground">
                                                No customer matches that.
                                            </li>
                                        ) : (
                                            filteredCustomers.map((cust) => {
                                                const custId = String(cust._id || (cust as any).id)
                                                const isSelected = custId === selectedCustomerId
                                                const balance = toNum(cust.balance)
                                                return (
                                                    <li key={custId}>
                                                        <button
                                                            type="button"
                                                            onClick={() => pickCustomer(cust)}
                                                            aria-pressed={isSelected}
                                                            className={cn(
                                                                'flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors duration-250 ease-luxe outline-none hover:bg-muted/60 focus-visible:bg-muted/60',
                                                                isSelected && 'bg-accent/10 hover:bg-accent/15',
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    'flex size-4 shrink-0 items-center justify-center rounded border',
                                                                    isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-foreground/30',
                                                                )}
                                                            >
                                                                {isSelected && <Check className="size-3" />}
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <p className="truncate text-sm font-normal">{cust.name}</p>
                                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                                    {cust.companyName || 'No company'} · {cust.phone || 'No phone'}
                                                                </p>
                                                            </span>
                                                            <span className="shrink-0 text-right">
                                                                <span className="block text-xs text-muted-foreground">Balance</span>
                                                                <span className={cn('block text-sm font-semibold', balance < 0 ? 'text-destructive' : 'text-foreground')}>
                                                                    {formatCurrency(balance)}
                                                                </span>
                                                            </span>
                                                        </button>
                                                    </li>
                                                )
                                            })
                                        )}
                                    </ul>
                                    {errors.customer && <p className="text-xs text-destructive">{errors.customer}</p>}
                                </div>
                            )}

                            {/* What this customer said they'd pay, ahead of the transfer
                                actually showing up — purely advisory, never required. */}
                            {selectedCustomer && pendingExpectedPayments.length > 0 && (
                                <div className="space-y-2 border-t border-foreground/10 pt-4">
                                    <Label className={cn(MICRO, 'flex items-center gap-1.5 text-muted-foreground')}>
                                        <Hourglass className="size-3.5" /> {pendingExpectedPayments.length} pending expected payment{pendingExpectedPayments.length === 1 ? '' : 's'}
                                    </Label>
                                    <div className="space-y-2">
                                        {pendingExpectedPayments.map((ep) => (
                                            <div
                                                key={ep.id}
                                                className={cn(
                                                    'flex items-center justify-between gap-3 rounded-lg border p-3 text-sm',
                                                    resolvingExpectedId === ep.id ? 'border-accent bg-accent/5' : 'border-foreground/15',
                                                )}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setResolvingExpectedId((id) => (id === ep.id ? null : ep.id))}
                                                    className="min-w-0 flex-1 text-left"
                                                >
                                                    <p className="font-normal text-foreground">
                                                        {ep.expectedAmount ? formatCurrency(Number(ep.expectedAmount)) : 'Amount not given'}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {[ep.reference, ep.note].filter(Boolean).join(' — ') || 'No further detail'}
                                                    </p>
                                                </button>
                                                {ep.expectedAmount && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="shrink-0 gap-1.5 text-xs"
                                                        onClick={() => setStatementQuery(String(Number(ep.expectedAmount)))}
                                                    >
                                                        <Search className="size-3" /> Search near this
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {resolvingExpectedId && (
                                        <p className="text-xs text-muted-foreground">
                                            This deposit will mark the selected note as resolved once submitted.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 2. Destination bank account */}
                    <section className={PANEL}>
                        <SectionHeader
                            icon={<Landmark />}
                            tone="bg-info/10 text-info"
                            title="Receiving bank account"
                            description="Which company account the money landed in"
                        />
                        <div className={cn(PANEL_BODY, 'space-y-4')}>
                            <div className="space-y-2">
                                <Label htmlFor="bank-account-select" className={cn(MICRO, 'text-muted-foreground')}>
                                    Company bank account *
                                </Label>
                                <Select
                                    value={selectedBankId}
                                    onValueChange={(val) => {
                                        setSelectedBankId(val)
                                        // The pool is per-account, so a different bank
                                        // invalidates any row already picked.
                                        setStatementLines([])
                                        setErrors((prev) => ({ ...prev, bankAccount: '' }))
                                    }}
                                >
                                    <SelectTrigger className={cn('w-full', errors.bankAccount && 'border-destructive')}>
                                        <SelectValue placeholder={isLoadingBanks ? 'Loading bank accounts...' : 'Choose bank account...'}>
                                            {selectedBank && (
                                                <span className="truncate">
                                                    <span className="font-semibold uppercase">{selectedBank.bankName}</span>
                                                    <span className="text-muted-foreground"> — {selectedBank.accountNumber} • {selectedBank.accountName}</span>
                                                </span>
                                            )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(!bankAccounts || bankAccounts.length === 0) ? (
                                            <div className="p-3 text-xs text-muted-foreground text-center">No bank accounts configured</div>
                                        ) : (
                                            bankAccounts.map((bank) => (
                                                <SelectItem key={bank.id} value={String(bank.id)}>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold uppercase">{bank.bankName}</span>
                                                        <span className="text-xs text-muted-foreground font-mono">
                                                            {bank.accountNumber} • {bank.accountName}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.bankAccount && (
                                    <p className="text-xs text-destructive">{errors.bankAccount}</p>
                                )}
                            </div>

                            {selectedBank && (
                                <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase text-primary">Destination account</p>
                                        <p className="text-sm font-semibold text-foreground">{selectedBank.bankName}</p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {selectedBank.accountNumber} • {selectedBank.accountName}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs font-mono">{selectedBank.currency || 'NGN'}</Badge>
                                </div>
                            )}

                            {/* Match against the bank's own record rather than retyping it. */}
                            <div className="space-y-2 border-t border-foreground/10 pt-4">
                                <Label className={cn(MICRO, 'text-muted-foreground')}>
                                    Match to bank statement
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Pick one or more unmatched deposit.
                                </p>
                                <StatementLinePicker
                                    bankAccountId={selectedBankId || undefined}
                                    selected={statementLines}
                                    onToggle={toggleStatementLine}
                                    onClear={() => setStatementLines([])}
                                    query={statementQuery}
                                    onQueryChange={setStatementQuery}
                                />
                                {/* {lockedByStatement && (
                                    <p className="text-xs text-muted-foreground">
                                        {statementLines.length === 1
                                            ? 'Amount, depositor, date and reference below are taken from that bank statement line and locked. Clear the selection to enter them by hand.'
                                            : `This records ${statementLines.length} separate deposits, one per line — the fields below preview the combined total and are locked. Clear the selection to enter a deposit by hand instead.`}
                                    </p>
                                )} */}
                            </div>
                        </div>
                    </section>

                    {/* 3. Deposit details */}
                    <section className={PANEL}>
                        <SectionHeader
                            icon={<DollarSign />}
                            tone="bg-success/10 text-success"
                            title="Deposit & payment details"
                            description="Pulled from the matched statement line(s)"
                        />
                        <div className={cn(PANEL_BODY, 'space-y-3')}>
                            {!lockedByStatement ? (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Select one or more statement lines above to populate the deposit details.
                                </p>
                            ) : (
                                <>
                                    <ul className="divide-y divide-foreground/10 rounded-lg border border-foreground/15">
                                        {statementLines.map((line) => (
                                            <li key={line.id} className="flex items-start justify-between gap-3 px-3.5 py-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-foreground" title={line.depositor || 'Unnamed depositor'}>
                                                        {truncateText(line.depositor || 'Unnamed depositor')}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                        {format(new Date(line.txn_date), 'd MMM yyyy, HH:mm')}
                                                        {line.bank_ref ? ` · ${line.bank_ref}` : ''}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 font-mono text-sm font-semibold">
                                                    {formatCurrency(Number(line.amount))}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    {statementLines.length > 1 && (
                                        <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3.5 py-2.5">
                                            <span className="text-xs text-muted-foreground uppercase">Combined total</span>
                                            <span className="font-mono text-sm font-semibold">{formatCurrency(numAmount)}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </section>

                </div>

                {/* Right side: live summary + submit */}
                <div className="lg:sticky lg:top-6">
                    <section className={PANEL}>
                        <div className={PANEL_RAIL}>
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-success" />
                                <h2 className="text-sm font-semibold text-foreground">Transaction summary</h2>
                            </div>
                        </div>
                        <div className={cn(PANEL_BODY, 'space-y-4')}>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Customer</span>
                                    <span className="max-w-[150px] truncate font-semibold text-foreground">
                                        {selectedCustomer?.name || '—'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Receiving bank</span>
                                    <span className="max-w-[150px] truncate font-semibold text-foreground">
                                        {selectedBank ? selectedBank.bankName : '—'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>Current balance</span>
                                    <span className="font-mono font-normal text-foreground">
                                        {formatCurrency(currentBalance)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-muted-foreground">
                                    <span>{statementLines.length > 1 ? `Deposit credit (${statementLines.length} entries)` : 'Deposit credit'}</span>
                                    <span className="font-mono font-semibold text-success">
                                        +{formatCurrency(numAmount)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between border-t border-foreground/10 pt-3">
                                    <span className="font-semibold text-foreground">Updated balance</span>
                                    <span className="font-mono text-lg font-semibold text-success">
                                        {formatCurrency(newBalance)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 rounded-lg border border-success/20 bg-success/10 p-3 text-xs text-success">
                                <ArrowDownLeft className="size-4 shrink-0 text-success" />
                                <p>
                                    {statementLines.length > 1
                                        ? `Upon submission, ${statementLines.length} separate deposits are recorded — one per statement line — and the customer's account balance updates by their combined total.`
                                        : 'Upon submission, the customer’s account balance updates automatically and any pending orders are processed.'}
                                </p>
                            </div>
                        </div>
                        <div className={cn(PANEL_FOOTER, 'border-t border-foreground/15')}>
                            <Button
                                type="submit"
                                className="w-full gap-2 font-normal"
                                disabled={createDepositMutation.isPending}
                            >
                                {createDepositMutation.isPending ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" /> Recording deposit…
                                    </>
                                ) : statementLines.length > 1 ? (
                                    <>
                                        <CheckCircle2 className="size-4" /> Submit {statementLines.length} deposits
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="size-4" /> Submit & credit balance
                                    </>
                                )}
                            </Button>
                        </div>
                    </section>
                </div>
            </form>
        </div>
    )
}
