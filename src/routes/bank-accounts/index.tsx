import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import {
  Landmark,
  Plus,
  Search,
  Edit,
  Eye,
  Trash2,
  Copy,
  Check,
  Warehouse,
  ShieldCheck,
  X,
  Loader2,
  Building2,
  Star,
} from 'lucide-react'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { useBankAccounts, useDeleteBankAccount } from '#/lib/hooks/useBankAccounts'
import { useDepots } from '#/lib/hooks/useDepots'
import { useToast } from '#/lib/hooks/useToast'

export const Route = createFileRoute('/bank-accounts/')({
  component: BankAccountsIndex,
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'Active':
      return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-medium">{status}</Badge>
    case 'Inactive':
      return <Badge variant="outline" className="text-muted-foreground">{status}</Badge>
    case 'Suspended':
      return <Badge variant="destructive">{status}</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function BankAccountsIndex() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [copiedId, setCopiedId] = useState<string | number | null>(null)
  const [deletingId, setDeletingId] = useState<string | number | null>(null)

  const { data: bankAccounts = [], isLoading, isError, error, refetch } = useBankAccounts()
  const hasFilters = !!(searchTerm || statusFilter !== 'ALL')
  const { data: depots = [] } = useDepots()
  const deleteBankAccount = useDeleteBankAccount()

  const handleCopyAccount = (accountNumber: string, id: string | number) => {
    navigator.clipboard.writeText(accountNumber)
    setCopiedId(id)
    toast.success(`Account number ${accountNumber} copied to clipboard`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (id: string | number, name: string) => {
    if (window.confirm(`Are you sure you want to delete bank account "${name}"?`)) {
      setDeletingId(id)
      try {
        await deleteBankAccount.mutateAsync(id)
      } finally {
        setDeletingId(null)
      }
    }
  }

  const filteredAccounts = bankAccounts.filter((account) => {
    const matchesSearch =
      account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.depots || []).some(
        (d) =>
          d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.code.toLowerCase().includes(searchTerm.toLowerCase())
      )

    const matchesStatus = statusFilter === 'ALL' || account.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Linked depots count across all bank accounts
  const uniqueLinkedDepotIds = new Set(bankAccounts.flatMap((acc) => acc.depotIds || []))
  const activeCount = bankAccounts.filter((a) => a.status === 'Active').length
  const defaultAccount = bankAccounts.find((a) => a.isDefault)

  const statsCards = [
    {
      title: 'Total Bank Accounts',
      value: bankAccounts.length,
      sub: `${activeCount} Active`,
      icon: Landmark,
      color: 'text-emerald-400',
    },
    {
      title: 'Depots Connected',
      value: uniqueLinkedDepotIds.size,
      sub: `Out of ${depots.length} total depots`,
      icon: Warehouse,
      color: 'text-blue-400',
    },
    {
      title: 'Primary Operating Account',
      value: defaultAccount ? defaultAccount.bankName : 'None set',
      sub: defaultAccount ? defaultAccount.accountNumber : 'Set a default account',
      icon: ShieldCheck,
      color: 'text-amber-400',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Bank Accounts Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage corporate bank accounts and depot collection assignments. Multiple depots can share a single bank account.
          </p>
        </div>
        <Button
          size="sm"
          className="gradient-primary text-white border-0 shadow-md hover:shadow-lg transition-all shrink-0"
          onClick={() => navigate({ to: '/bank-accounts/form' })}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {/* Stats Cards */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsCards.map((card, idx) => (
            <Card key={idx} className="stats-card border-border/40 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-5 flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Bank Accounts Directory</CardTitle>
              <CardDescription>View, edit, and assign bank accounts to operational depots</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by bank name, account number, or depot..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-9 bg-background/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Clear search"
                >
                  <X size={10} />
                </button>
              )}
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Accounts Grid */}
          {isLoading ? (
            <PageLoader message="Loading bank accounts..." />
          ) : isError ? (
            <PageError message={(error as any)?.message || 'Failed to load'} onRetry={() => refetch()} />
          ) : filteredAccounts.length === 0 ? (
            <PageEmpty
              icon={<Landmark size={24} className="text-muted-foreground" />}
              title={hasFilters ? 'No bank accounts match your filters' : 'No bank accounts yet'}
              description={hasFilters ? 'No bank accounts match your search or filter parameters.' : 'Get started by adding your first company bank account.'}
              actionLabel="Add Bank Account"
              onAction={() => navigate({ to: '/bank-accounts/form' })}
              hasFilters={hasFilters}
              onClearFilters={() => { setSearchTerm(''); setStatusFilter('ALL') }}
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAccounts.map((account) => {
                const assignedDepots = account.depots || []
                return (
                  <Card
                    key={account.id}
                    className="card-hover border-border/60 hover:border-primary/40 bg-card/80 transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Header: Bank Name & Badges */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground text-base tracking-tight leading-snug">
                                {account.bankName}
                              </h3>
                              {account.branchName && (
                                <p className="text-xs text-muted-foreground truncate">{account.branchName}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {account.isDefault && (
                              <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 gap-1 text-[11px] py-0.5 px-2">
                                <Star className="w-3 h-3 fill-amber-400" /> Default
                              </Badge>
                            )}
                            {getStatusBadge(account.status)}
                          </div>
                        </div>

                        {/* Account Number Box */}
                        <div className="bg-muted/40 border border-border/50 rounded-lg p-3 my-3 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Account Number ({account.currency})
                            </p>
                            <p className="text-lg font-mono font-bold tracking-wider text-foreground">
                              {account.accountNumber}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                            onClick={() => handleCopyAccount(account.accountNumber, account.id)}
                            title="Copy Account Number"
                          >
                            {copiedId === account.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>

                        {/* Account Name */}
                        <div className="mb-3">
                          <p className="text-[11px] text-muted-foreground uppercase font-medium">Account Name</p>
                          <p className="text-sm font-semibold text-foreground truncate">{account.accountName}</p>
                        </div>

                        {/* Linked Depots Section */}
                        <div className="mt-4 pt-3 border-t border-border/40">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                              <Warehouse className="w-3.5 h-3.5 text-primary" /> Linked Depots ({assignedDepots.length})
                            </span>
                            {assignedDepots.length > 1 && (
                              <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                Shared Account
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                            {assignedDepots.length === 0 ? (
                              <span className="text-xs italic text-muted-foreground">
                                No depots assigned (Company-wide / Unassigned)
                              </span>
                            ) : (
                              assignedDepots.map((depot) => (
                                <Badge
                                  key={depot.id}
                                  variant="secondary"
                                  className="text-xs bg-primary/10 text-primary border border-primary/20 font-medium py-0.5"
                                >
                                  {depot.name} ({depot.code})
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-border/40">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-medium"
                          onClick={() =>
                            navigate({
                              to: '/bank-accounts/details' as any,
                              state: { bankAccount: account } as any,
                            })
                          }
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-medium border-border/60"
                          onClick={() =>
                            navigate({
                              to: '/bank-accounts/form' as any,
                              state: { bankAccount: account, isEdit: true } as any,
                            })
                          }
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          disabled={deletingId === account.id}
                          onClick={() => handleDelete(account.id, account.bankName)}
                        >
                          {deletingId === account.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
