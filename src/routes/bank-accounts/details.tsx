import { useState } from 'react'
import { createFileRoute, useNavigate, useLocation } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '#/components/ui/card'
import {
  ArrowLeft,
  Landmark,
  Building2,
  Copy,
  Check,
  Edit,
  Trash2,
  Warehouse,
  Star,
  MapPin,
  FileText,
  Calendar,
  Layers,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { useBankAccountDetails, useDeleteBankAccount, type BankAccount } from '#/lib/hooks/useBankAccounts'
import { useToast } from '#/lib/hooks/useToast'

export const Route = createFileRoute('/bank-accounts/details')({
  component: BankAccountDetails,
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'Active':
      return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-medium px-3 py-1">{status}</Badge>
    case 'Inactive':
      return <Badge variant="outline" className="text-muted-foreground px-3 py-1">{status}</Badge>
    case 'Suspended':
      return <Badge variant="destructive" className="px-3 py-1">{status}</Badge>
    default:
      return <Badge variant="outline" className="px-3 py-1">{status}</Badge>
  }
}

function BankAccountDetails() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const deleteBankAccount = useDeleteBankAccount()

  const stateData = location.state as { bankAccount?: BankAccount } | undefined
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const accountIdFromUrl = searchParams?.get('id') || searchParams?.get('accountId') || ''

  const stateAccount = stateData?.bankAccount
  const accountId = stateAccount?.id || accountIdFromUrl

  const { data: fetchedAccount, isLoading } = useBankAccountDetails(accountId)
  const account = stateAccount || fetchedAccount

  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCopyAccount = (num: string) => {
    navigator.clipboard.writeText(num)
    setCopied(true)
    toast.success(`Account number ${num} copied to clipboard`)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    if (!account) return
    if (window.confirm(`Are you sure you want to delete bank account "${account.bankName}"?`)) {
      setIsDeleting(true)
      try {
        await deleteBankAccount.mutateAsync(account.id)
        navigate({ to: '/bank-accounts' })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  if (isLoading && !account) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading bank account details...</p>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/bank-accounts' })}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Bank Accounts
        </Button>
        <Card className="p-12 text-center border-dashed">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Bank Account Not Found</h2>
          <p className="text-sm text-muted-foreground mt-1">The requested bank account could not be found or has been removed.</p>
          <Button className="gradient-primary text-white border-0 mt-4" onClick={() => navigate({ to: '/bank-accounts' })}>
            Return to List
          </Button>
        </Card>
      </div>
    )
  }

  const assignedDepots = account.depots || []
  const isShared = assignedDepots.length > 1

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/bank-accounts' })} className="w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Bank Accounts
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({
                to: '/bank-accounts/form' as any,
                state: { bankAccount: account, isEdit: true } as any,
              })
            }
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Account
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Delete
          </Button>
        </div>
      </div>

      {/* Account Overview Header Card */}
      <Card className="border-border/60 bg-gradient-to-br from-card to-card/70 shadow-md overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{account.bankName}</h1>
                  {account.isDefault && (
                    <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1 px-2.5 py-0.5 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> Default Account
                    </Badge>
                  )}
                  {getStatusBadge(account.status)}
                </div>
                <p className="text-base font-semibold text-muted-foreground mt-1">{account.accountName}</p>
                {account.branchName && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Branch: {account.branchName}
                  </p>
                )}
              </div>
            </div>

            {/* Large Account Number Card */}
            <div className="bg-muted/40 border border-border/60 rounded-xl p-4 md:px-6 md:py-4 flex items-center justify-between gap-6 shrink-0">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Account Number ({account.currency})
                </p>
                <p className="text-2xl md:text-3xl font-mono font-extrabold tracking-wider text-foreground mt-0.5">
                  {account.accountNumber}
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0 border-border/60 hover:bg-primary/10"
                onClick={() => handleCopyAccount(account.accountNumber)}
                title="Copy Account Number"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Account Information */}
        <Card className="md:col-span-1 border-border/60">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Landmark className="w-4 h-4 text-primary" /> Account Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bank Name</p>
              <p className="text-foreground font-semibold mt-0.5">{account.bankName}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Account Name</p>
              <p className="text-foreground font-semibold mt-0.5">{account.accountName}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Account Number</p>
              <p className="text-foreground font-mono font-bold mt-0.5">{account.accountNumber}</p>
            </div>

            {account.bankCode && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bank Code / Sort Code</p>
                <p className="text-foreground font-mono font-medium mt-0.5">{account.bankCode}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Currency</p>
              <p className="text-foreground font-medium mt-0.5">{account.currency}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Operational Status</p>
              <div className="mt-1">{getStatusBadge(account.status)}</div>
            </div>

            {account.createdAt && (
              <div className="pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date Added
                </p>
                <p className="text-xs text-foreground mt-0.5">
                  {new Date(account.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            {account.notes && (
              <div className="pt-3 border-t border-border/40">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Notes / Remarks
                </p>
                <p className="text-xs text-foreground/90 mt-1 whitespace-pre-wrap rounded-lg bg-muted/30 p-2.5 border border-border/40">
                  {account.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Linked Depots */}
        <Card className="md:col-span-2 border-border/60">
          <CardHeader className="border-b border-border/40 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-primary" /> Assigned Depots & Hubs ({assignedDepots.length})
              </CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Depots collecting or remitting payments through this bank account
              </CardDescription>
            </div>
            {isShared && (
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium text-xs px-2.5 py-1">
                Shared by {assignedDepots.length} Depots
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            {assignedDepots.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-border/50 bg-muted/20">
                <Warehouse className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">No Depots Currently Linked</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  This bank account is configured as a general company account and is not assigned to specific depots.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 text-xs"
                  onClick={() =>
                    navigate({
                      to: '/bank-accounts/form' as any,
                      state: { bankAccount: account, isEdit: true } as any,
                    })
                  }
                >
                  <Edit className="w-3.5 h-3.5 mr-1" /> Assign Depots Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {isShared && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-300">
                    <Layers className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <span className="font-semibold text-amber-200">Shared Bank Account Notice:</span> Multiple operational depots deposit into or share this exact bank account. Transactions made to this account should reference the respective depot code.
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {assignedDepots.map((depot) => (
                    <div
                      key={depot.id}
                      className="p-4 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                            <Warehouse className="w-4 h-4 text-primary shrink-0" />
                            {depot.name}
                          </h4>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {depot.code}
                          </Badge>
                        </div>
                        {depot.city && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {depot.city}{depot.state ? `, ${depot.state}` : ''}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-2 border-t border-border/30 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Status: <span className="font-medium text-foreground">{depot.status || 'Active'}</span></span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 p-1 px-2"
                          onClick={() => navigate({ to: '/depots/details' as any, state: { depot } as any })}
                        >
                          View Depot <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
