import { useState, useMemo } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Landmark, User, DollarSign, Loader2, CheckCircle2, ShieldCheck, ArrowDownLeft } from 'lucide-react'
import { useCustomerList } from '#/lib/hooks/useCustomers'
import { useBankAccounts } from '#/lib/hooks/useBankAccounts'
import { useCreateDeposit } from '#/lib/hooks/useDeposits'
import { StatementLinePicker } from '#/components/StatementLinePicker'
import { useMatchStatementLines, type StatementLine } from '#/lib/hooks/useBankStatements'
import { toNum } from '#/lib/utils'
import type { Customer, } from '#/lib/types'

export const Route = createFileRoute('/deposits/manual-deposit')({
    component: ManualDepositPage,
})

function formatCurrency(val: number) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(val)
}

function ManualDepositPage() {
    const navigate = useNavigate()
    const { data: customerData, isLoading: isLoadingCustomers } = useCustomerList({ limit: 500 })
    const { data: bankAccounts, isLoading: isLoadingBanks } = useBankAccounts({ status: 'Active' })
    const createDepositMutation = useCreateDeposit()
    const matchLines = useMatchStatementLines()
    // The statement row this payment is being confirmed against, if any.
    const [statementLine, setStatementLine] = useState<StatementLine | null>(null)

    const customersList: Customer[] = useMemo(() => {
        if (!customerData) return []
        return Array.isArray(customerData) ? customerData : (customerData as any)?.customers || []
    }, [customerData])

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
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
        if (!depositorName.trim()) {
            errs.depositorName = 'Payer/Depositor name is required'
        }
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    /** Picking a statement row fills the payment from the bank's own record. */
    const applyStatementLine = (line: StatementLine) => {
        // The date field is datetime-local, which needs YYYY-MM-DDTHH:mm in
        // local time — an ISO string would be rejected as out of format.
        const d = new Date(line.txn_date)
        const pad = (n: number) => String(n).padStart(2, '0')
        const localDateTime =
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
            `T${pad(d.getHours())}:${pad(d.getMinutes())}`

        setStatementLine(line)
        setAmount(String(Number(line.amount)))
        setDepositorName(line.depositor || '')
        setPaymentDate(localDateTime)
        setReference(line.bank_ref || '')
        if (line.narration && !description.trim()) setDescription(line.narration)
        setErrors({})
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        if (!selectedCustomer || !selectedBank) return

        try {
            const res = await createDepositMutation.mutateAsync({
                customer: selectedCustomer._id || (selectedCustomer as any).id,
                amount: numAmount,
                bankAccountId: selectedBank.id,
                bankName: selectedBank.bankName,
                accountName: selectedBank.accountName,
                accountNumber: selectedBank.accountNumber,
                depositorName: depositorName.trim(),
                paymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
                reference: reference.trim(),
                description: description.trim() || `Manual deposit into ${selectedBank.bankName} (${selectedBank.accountNumber}) by ${depositorName.trim()}`,
            })

            if (res?.success) {
                // Claim the statement row so no other payment can use it.
                if (statementLine) {
                    await matchLines
                        .mutateAsync({
                            lineIds: [statementLine.id],
                            depositId: res?.data?.deposit?.id,
                        })
                        .catch(() => {
                            // The deposit is already recorded; a failed claim
                            // must not lose it. The row simply stays unmatched.
                        })
                }
                navigate({ to: '/deposits/' as any })
            }
        } catch {
            // Error handled by mutation toast
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
            <PageHeader
      eyebrow="Finance"
      title="Record Manual Deposit"
      description="Register direct bank transfer or teller deposit to customer account."
    />

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Customer Selection */}
                    <Card className="border-border">
                        <CardHeader className="border-b border-border pb-4">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <User className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">1. Select Customer</CardTitle>
                                    <CardDescription className="text-xs">
                                        Choose the customer receiving this deposit credit
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="customer-search" className="text-xs font-semibold uppercase text-muted-foreground">
                                    Search & Select Customer *
                                </Label>
                                <div className="space-y-2">
                                    <Input
                                        id="customer-search"
                                        type="text"
                                        placeholder="Search by customer name, company, or phone..."
                                        value={customerSearchTerm}
                                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                        className="text-sm"
 />
                                    <Select
                                        value={selectedCustomerId}
                                        onValueChange={(val) => {
                                            setSelectedCustomerId(val)
                                            setErrors((prev) => ({ ...prev, customer: '' }))
                                        }}
 >
                                        <SelectTrigger className={`w-full ${errors.customer ? 'border-destructive' : ''}`}>
                                            <SelectValue placeholder={isLoadingCustomers ? 'Loading customers...' : 'Choose customer...'} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {filteredCustomers.length === 0 ? (
                                                <div className="p-3 text-xs text-muted-foreground text-center">No matching customers found</div>
                                            ) : (
                                                filteredCustomers.map((cust) => (
                                                    <SelectItem key={cust._id || (cust as any).id} value={String(cust._id || (cust as any).id)}>
                                                        <div className="flex items-center justify-between gap-4 w-full text-left">
                                                            <span className="font-normal">{cust.name}</span>
                                                            {cust.companyName && (
                                                                <span className="text-xs text-muted-foreground">({cust.companyName})</span>
                                                            )}
                                                            <span className="text-xs font-mono text-success ml-auto">
                                                                Balance: {formatCurrency(toNum(cust.balance))}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {errors.customer && <p className="text-xs text-destructive mt-1">{errors.customer}</p>}
                            </div>

                            {selectedCustomer && (
                                <div className="p-4 rounded-xl bg-muted/60 border border-border flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{selectedCustomer.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {selectedCustomer.companyName ? `${selectedCustomer.companyName} • ` : ''}
                                            {selectedCustomer.phone || 'No phone'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground font-normal uppercase">Current Balance</p>
                                        <p className="text-base font-semibold text-foreground font-mono">
                                            {formatCurrency(currentBalance)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 2. Destination Bank Account */}
                    <Card className="border-border">
                        <CardHeader className="border-b border-border pb-4">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-info/10 flex items-center justify-center text-info">
                                    <Landmark className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">2. Receiving Bank Account</CardTitle>
                                    <CardDescription className="text-xs">
                                        Select the company bank account where the money was deposited
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bank-account-select" className="text-xs font-semibold uppercase text-muted-foreground">
                                    Select Company Bank Account *
                                </Label>
                                <Select
                                    value={selectedBankId}
                                    onValueChange={(val) => {
                                        setSelectedBankId(val)
                                        // The pool is per-account, so a different bank
                                        // invalidates any row already picked.
                                        setStatementLine(null)
                                        setErrors((prev) => ({ ...prev, bankAccount: '' }))
                                    }}
 >
                                    <SelectTrigger className={`w-full ${errors.bankAccount ? 'border-destructive' : ''}`}>
                                        <SelectValue placeholder={isLoadingBanks ? 'Loading bank accounts...' : 'Choose bank account...'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(!bankAccounts || bankAccounts.length === 0) ? (
                                            <div className="p-3 text-xs text-muted-foreground text-center">No bank accounts configured</div>
                                        ) : (
                                            bankAccounts.map((bank) => (
                                                <SelectItem key={bank.id} value={String(bank.id)}>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="font-normal">{bank.bankName}</span>
                                                        <span className="text-xs text-muted-foreground font-mono">{bank.accountNumber} ({bank.accountName})</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.bankAccount && (
                                    <p className="text-sm text-destructive" role="alert">{errors.bankAccount}</p>
                                )}
                            </div>

                            {/* Match against the bank's own record rather than retyping it. */}
                            <div className="space-y-2 border-t border-foreground/10 pt-4">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                                    Match to a bank statement deposit
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Pick the actual deposit row and the amount, payer, date and
                                    reference fill themselves.
                                </p>
                                <StatementLinePicker
                                    bankAccountId={selectedBankId || undefined}
                                    selected={statementLine}
                                    onSelect={applyStatementLine}
                                    onClear={() => setStatementLine(null)}
                                />
                                {errors.bankAccount && <p className="text-xs text-destructive mt-1">{errors.bankAccount}</p>}
                            </div>

                            {selectedBank && (
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-primary font-semibold uppercase">Destination Account</p>
                                        <p className="text-sm font-semibold text-foreground">{selectedBank.bankName}</p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {selectedBank.accountNumber} • {selectedBank.accountName}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs font-mono">{selectedBank.currency || 'NGN'}</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 3. Deposit Details */}
                    <Card className="border-border">
                        <CardHeader className="border-b border-border pb-4">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                                    <DollarSign className="size-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">3. Deposit & Payment Details</CardTitle>
                                    <CardDescription className="text-xs">
                                        Enter amount, depositor name, and payment reference
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Deposit Amount */}
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-xs font-semibold uppercase text-muted-foreground">
                                        Deposit Amount (NGN ₦) *
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold">₦</span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="1"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => {
                                                setAmount(e.target.value)
                                                setErrors((prev) => ({ ...prev, amount: '' }))
                                            }}
                                            className={`pl-8 text-base font-semibold font-mono ${errors.amount ? 'border-destructive' : ''}`}
 />
                                    </div>
                                    {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                                </div>

                                {/* Depositor / Payer Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="depositorName" className="text-xs font-semibold uppercase text-muted-foreground">
                                        Payer / Depositor Name *
                                    </Label>
                                    <Input
                                        id="depositorName"
                                        type="text"
                                        placeholder="e.g. John Doe (Transfer)"
                                        value={depositorName}
                                        onChange={(e) => {
                                            setDepositorName(e.target.value)
                                            setErrors((prev) => ({ ...prev, depositorName: '' }))
                                        }}
                                        className={errors.depositorName ? 'border-destructive' : ''}
 />
                                    {errors.depositorName && <p className="text-xs text-destructive">{errors.depositorName}</p>}
                                </div>

                                {/* Date of Payment */}
                                <div className="space-y-2">
                                    <Label htmlFor="paymentDate" className="text-xs font-semibold uppercase text-muted-foreground">
                                        Date & Time of Deposit
                                    </Label>
                                    <Input
                                        id="paymentDate"
                                        type="datetime-local"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
 />
                                </div>

                                {/* Reference */}
                                <div className="space-y-2">
                                    <Label htmlFor="reference" className="text-xs font-semibold uppercase text-muted-foreground">
                                        Transaction / Teller Ref (Optional)
                                    </Label>
                                    <Input
                                        id="reference"
                                        type="text"
                                        placeholder="e.g. TRX-9082319"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        className="font-mono text-sm"
 />
                                </div>
                            </div>

                            {/* Description / Notes */}
                            <div className="space-y-2 pt-2">
                                <Label htmlFor="description" className="text-xs font-semibold uppercase text-muted-foreground">
                                    Description / Remarks (Optional)
                                </Label>
                                <Input
                                    id="description"
                                    type="text"
                                    placeholder="e.g. Direct bank deposit received for diesel order"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
 />
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Right Side Summary Column */}
                <div className="space-y-6">
                    <Card className="border-border sticky top-6">
                        <CardHeader className="bg-muted/40 border-b border-border pb-4">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-success" />
                                <CardTitle className="text-base">Transaction Summary</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-4">

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center text-muted-foreground">
                                    <span>Customer</span>
                                    <span className="font-semibold text-foreground truncate max-w-[150px]">
                                        {selectedCustomer?.name || '—'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-muted-foreground">
                                    <span>Receiving Bank</span>
                                    <span className="font-semibold text-foreground truncate max-w-[150px]">
                                        {selectedBank ? `${selectedBank.bankName}` : '—'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-muted-foreground">
                                    <span>Current Balance</span>
                                    <span className="font-mono text-foreground font-normal">
                                        {formatCurrency(currentBalance)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-muted-foreground">
                                    <span>Deposit Credit</span>
                                    <span className="font-mono text-success font-semibold">
                                        +{formatCurrency(numAmount)}
                                    </span>
                                </div>

                                <div className="border-t border-border pt-3 flex justify-between items-center">
                                    <span className="font-semibold text-foreground">Updated Balance</span>
                                    <span className="font-mono text-lg font-semibold text-success">
                                        {formatCurrency(newBalance)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-xs text-success-foreground flex items-start gap-2">
                                <ArrowDownLeft className="size-4 text-success shrink-0 mt-0.5" />
                                <p>
                                    Upon submission, the customer&apos;s account balance will be updated automatically and any pending orders will be processed.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-border pt-4 bg-muted/20">
                            <Button
                                type="submit"
                                className="w-full font-normal gap-2"
                                disabled={createDepositMutation.isPending}
 >
                                {createDepositMutation.isPending ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" /> Recording Deposit...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="size-4" /> Submit & Credit Balance
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </div>
    )
}
