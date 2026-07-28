import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, useLocation } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '#/components/ui/card'
import { Badge } from '#/components/ui/badge'
import {
  ArrowLeft,
  Landmark,
  Building2,
  Warehouse,
  Loader2,
  Search,
  Check,
  X,
  Star,
} from 'lucide-react'
import {
  useCreateBankAccount,
  useUpdateBankAccount,
  useBankAccountDetails,
  type BankAccount,
} from '#/lib/hooks/useBankAccounts'
import { useDepots } from '#/lib/hooks/useDepots'
import { useToast } from '#/lib/hooks/useToast'

export const Route = createFileRoute('/bank-accounts/form')({
  component: BankAccountForm,
})

const NIGERIAN_BANKS = [
  'Zenith Bank',
  'Guaranty Trust Bank (GTBank)',
  'First Bank of Nigeria',
  'Access Bank',
  'United Bank for Africa (UBA)',
  'Wema Bank',
  'Sterling Bank',
  'Fidelity Bank',
  'Union Bank',
  'Stanbic IBTC Bank',
  'Kuda Bank',
  'Moniepoint Microfinance Bank',
  'OPay',
  'Ecobank Nigeria',
  'First City Monument Bank (FCMB)',
  'Providus Bank',
  'Other (Custom Bank)',
]

function BankAccountForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const createBankAccount = useCreateBankAccount()
  const updateBankAccount = useUpdateBankAccount()

  const stateData = location.state as { bankAccount?: BankAccount; isEdit?: boolean } | undefined
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const accountIdFromUrl = searchParams?.get('id') || searchParams?.get('accountId') || ''

  const stateAccount = stateData?.bankAccount
  const accountId = stateAccount?.id || accountIdFromUrl
  const isEdit = Boolean(stateData?.isEdit || accountId)

  const { data: fetchedAccount, isLoading: isLoadingAccount } = useBankAccountDetails(accountId)
  const editingAccount = stateAccount || fetchedAccount

  const { data: depots = [], isLoading: isLoadingDepots } = useDepots()

  // Form State
  const [selectedBankPreset, setSelectedBankPreset] = useState<string>('Zenith Bank')
  const [customBankName, setCustomBankName] = useState<string>('')
  const [accountName, setAccountName] = useState<string>('')
  const [accountNumber, setAccountNumber] = useState<string>('')
  const [bankCode, setBankCode] = useState<string>('')
  const [branchName, setBranchName] = useState<string>('')
  const [currency, setCurrency] = useState<string>('NGN')
  const [status, setStatus] = useState<'Active' | 'Inactive' | 'Suspended'>('Active')
  const [isDefault, setIsDefault] = useState<boolean>(false)
  const [notes, setNotes] = useState<string>('')

  // Depot Multi-Select State
  const [selectedDepotIds, setSelectedDepotIds] = useState<number[]>([])
  const [depotSearchTerm, setDepotSearchTerm] = useState<string>('')

  // Populate form on edit
  useEffect(() => {
    if (editingAccount) {
      const bank = editingAccount.bankName || ''
      if (NIGERIAN_BANKS.includes(bank)) {
        setSelectedBankPreset(bank)
      } else if (bank) {
        setSelectedBankPreset('Other (Custom Bank)')
        setCustomBankName(bank)
      }
      setAccountName(editingAccount.accountName || '')
      setAccountNumber(editingAccount.accountNumber || '')
      setBankCode(editingAccount.bankCode || '')
      setBranchName(editingAccount.branchName || '')
      setCurrency(editingAccount.currency || 'NGN')
      setStatus(editingAccount.status || 'Active')
      setIsDefault(Boolean(editingAccount.isDefault))
      setNotes(editingAccount.notes || '')

      const rawDepotIds = editingAccount.depotIds || (editingAccount.depots || []).map((d) => d.id)
      const numericIds = (Array.isArray(rawDepotIds) ? rawDepotIds : [])
        .map((i) => Number(i))
        .filter((i) => !isNaN(i) && i > 0)
      setSelectedDepotIds(numericIds)
    }
  }, [editingAccount])

  const toggleDepotSelection = (id: number) => {
    setSelectedDepotIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    )
  }

  const handleSelectAllDepots = () => {
    setSelectedDepotIds(depots.map((d) => Number(d.id)).filter((id) => !isNaN(id)))
  }

  const handleClearDepotSelection = () => {
    setSelectedDepotIds([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalBankName = selectedBankPreset === 'Other (Custom Bank)' ? customBankName.trim() : selectedBankPreset.trim()

    if (!finalBankName) {
      toast.error('Please select or specify a bank name')
      return
    }
    if (!accountName.trim()) {
      toast.error('Please enter the account name')
      return
    }
    if (!accountNumber.trim() || accountNumber.trim().length < 5) {
      toast.error('Please enter a valid account number')
      return
    }

    const payload = {
      bankName: finalBankName,
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      bankCode: bankCode.trim(),
      branchName: branchName.trim(),
      currency,
      status,
      isDefault,
      depotIds: selectedDepotIds,
      notes: notes.trim(),
    }

    try {
      if (isEdit && accountId) {
        await updateBankAccount.mutateAsync({ id: accountId, data: payload })
      } else {
        await createBankAccount.mutateAsync(payload)
      }
      navigate({ to: '/bank-accounts' })
    } catch (err) {
      // Handled in mutation onError toast
    }
  }

  const filteredDepots = depots.filter((depot) =>
    depot.name.toLowerCase().includes(depotSearchTerm.toLowerCase()) ||
    depot.code.toLowerCase().includes(depotSearchTerm.toLowerCase()) ||
    (depot.city && depot.city.toLowerCase().includes(depotSearchTerm.toLowerCase()))
  )

  const isSubmitting = createBankAccount.isPending || updateBankAccount.isPending

  if (isEdit && isLoadingAccount && !editingAccount) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading bank account details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/bank-accounts' })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Bank Accounts
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {isEdit ? 'Edit Bank Account' : 'Add New Bank Account'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isEdit
              ? 'Update bank account details and depot assignments'
              : 'Create a new corporate bank account and assign it to operational depots'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Bank & Account Info */}
        <Card className="border-border/60">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Landmark className="w-4 h-4 text-primary" /> Account Information
            </CardTitle>
            <CardDescription className="text-xs">Provide official bank and account details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bank Name Preset */}
              <div className="space-y-1.5">
                <Label htmlFor="bankPreset" className="text-xs font-semibold">
                  Bank Name <span className="text-red-400">*</span>
                </Label>
                <Select value={selectedBankPreset} onValueChange={setSelectedBankPreset}>
                  <SelectTrigger id="bankPreset" className="bg-background/50">
                    <SelectValue placeholder="Select Bank" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {NIGERIAN_BANKS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Bank Name input if "Other" */}
              {selectedBankPreset === 'Other (Custom Bank)' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="customBank" className="text-xs font-semibold">
                    Custom Bank Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="customBank"
                    placeholder="Enter custom bank name"
                    value={customBankName}
                    onChange={(e) => setCustomBankName(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              ) : (
                /* Bank Code / Sort Code */
                <div className="space-y-1.5">
                  <Label htmlFor="bankCode" className="text-xs font-semibold">
                    Bank Code / Sort Code (Optional)
                  </Label>
                  <Input
                    id="bankCode"
                    placeholder="e.g. 057"
                    value={bankCode}
                    onChange={(e) => setBankCode(e.target.value)}
                    className="bg-background/50 font-mono"
                  />
                </div>
              )}

              {/* Account Number */}
              <div className="space-y-1.5">
                <Label htmlFor="accountNumber" className="text-xs font-semibold">
                  Account Number <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="accountNumber"
                  placeholder="e.g. 1012345678"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="bg-background/50 font-mono text-base font-semibold"
                />
              </div>

              {/* Account Name */}
              <div className="space-y-1.5">
                <Label htmlFor="accountName" className="text-xs font-semibold">
                  Account Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="accountName"
                  placeholder="e.g. Soroman Logistics Ltd - Apapa Ops"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* Branch Name */}
              <div className="space-y-1.5">
                <Label htmlFor="branchName" className="text-xs font-semibold">
                  Branch Name (Optional)
                </Label>
                <Input
                  id="branchName"
                  placeholder="e.g. Ikeja Main Branch"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-xs font-semibold">
                  Currency
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="bg-background/50">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN (Nigerian Naira ₦)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar $)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro €)</SelectItem>
                    <SelectItem value="GBP">GBP (Pound Sterling £)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-semibold">
                  Status
                </Label>
                <Select value={status} onValueChange={(val) => setStatus(val as any)}>
                  <SelectTrigger id="status" className="bg-background/50">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Default Account Checkbox */}
            <div className="pt-3 border-t border-border/40">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Set as Primary / Default Company Account
                  </span>
                  <p className="text-xs text-muted-foreground">
                    When checked, this account will be highlighted as the primary operating collection account.
                  </p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Depot Assignments */}
        <Card className="border-border/60">
          <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-primary" /> Assign Depots & Hubs
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Select which depot(s) use this bank account. Each depot can have its own account or share one.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-1 font-semibold">
              {selectedDepotIds.length} Selected
            </Badge>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* Search and Quick Selection Tools */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter depots..."
                  value={depotSearchTerm}
                  onChange={(e) => setDepotSearchTerm(e.target.value)}
                  className="pl-9 text-xs h-9 bg-background/50"
                />
                {depotSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setDepotSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllDepots}
                  className="h-9 text-xs"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearDepotSelection}
                  className="h-9 text-xs text-muted-foreground"
                >
                  Deselect All
                </Button>
              </div>
            </div>

            {/* Selected Depot Chips */}
            {selectedDepotIds.length > 0 && (
              <div className="p-3 bg-muted/30 border border-border/40 rounded-xl">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Currently Assigned ({selectedDepotIds.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDepotIds.map((id) => {
                    const depot = depots.find((d) => Number(d.id) === id)
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="bg-primary/15 text-primary border-primary/30 text-xs font-medium py-1 px-2.5 flex items-center gap-1.5"
                      >
                        <Warehouse className="w-3 h-3" />
                        {depot ? `${depot.name} (${depot.code})` : `Depot #${id}`}
                        <button
                          type="button"
                          onClick={() => toggleDepotSelection(id)}
                          className="hover:text-red-400 transition-colors ml-1"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Depots Checkbox List */}
            {isLoadingDepots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
                <span className="text-xs text-muted-foreground">Loading depots list...</span>
              </div>
            ) : filteredDepots.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                No depots match your search query.
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 max-h-72 overflow-y-auto pr-1">
                {filteredDepots.map((depot) => {
                  const numericId = Number(depot.id)
                  const isChecked = selectedDepotIds.includes(numericId)
                  return (
                    <div
                      key={depot.id}
                      onClick={() => toggleDepotSelection(numericId)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between select-none ${isChecked
                          ? 'border-primary/50 bg-primary/10 text-foreground shadow-sm'
                          : 'border-border/40 hover:bg-muted/30 text-muted-foreground'
                        }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-xs ${isChecked ? 'text-primary' : 'text-foreground'}`}>
                            {depot.name}
                          </span>
                          <span className="text-[10px] font-mono opacity-80">({depot.code})</span>
                        </div>
                        {depot.city && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{depot.city}, {depot.state}</p>
                        )}
                      </div>

                      <div
                        className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${isChecked ? 'bg-primary border-primary text-white' : 'border-border bg-background'
                          }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Additional Notes */}
        <Card className="border-border/60">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base font-semibold">Notes & Description</CardTitle>
            <CardDescription className="text-xs">Internal notes regarding usage or specific instructions</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <textarea
              rows={3}
              placeholder="e.g. Primary collection account for Western Region depots..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-border/60 bg-background/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/bank-accounts' })}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gradient-primary text-white border-0 px-6">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : isEdit ? (
              'Update Bank Account'
            ) : (
              'Create Bank Account'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
