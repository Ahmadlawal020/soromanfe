import { useState, useEffect, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'

import { Search, ArrowDownLeft, Eye, X, Banknote, Plus, Landmark, ArrowRightLeft, Filter } from 'lucide-react'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { Pagination } from '#/components/Pagination'
import { useDepositList } from '#/lib/hooks/useDeposits'
import type { Deposit } from '#/lib/hooks/useDeposits'
import { toNum } from '#/lib/utils'

export const Route = createFileRoute('/deposits/')({
  component: DepositsDashboard,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value)
}

function isPaystackDeposit(d: Deposit): boolean {
  const ps = d.paystackDetails as Record<string, any> | null | undefined
  return Boolean(
    ps?.transactionId ||
    ps?.paystackCustomerCode ||
    (ps?.gatewayResponse && String(ps.gatewayResponse).toLowerCase() !== 'manual') ||
    (ps?.channel && ps.channel !== 'manual_bank_transfer' && ps.channel !== 'manual')
  )
}

function DepositsDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'manual' | 'paystack'>('all')
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const POLL_INTERVAL = 30_000
  const { data, isLoading, isError, error, refetch } = useDepositList({ limit: 5000, refetchInterval: POLL_INTERVAL })
  const deposits = data?.deposits || []

  const hasFilters = !!searchTerm || filterType !== 'all' || timeFilter !== 'all'

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterType, timeFilter])

  // Count metrics for manual and paystack deposits
  const manualDeposits = useMemo(() => deposits.filter(d => !isPaystackDeposit(d)), [deposits])
  const paystackDeposits = useMemo(() => deposits.filter(d => isPaystackDeposit(d)), [deposits])

  const totalCredits = useMemo(() => deposits.reduce((sum: number, d: Deposit) => sum + toNum(d.amount), 0), [deposits])
  const manualCredits = useMemo(() => manualDeposits.reduce((sum: number, d: Deposit) => sum + toNum(d.amount), 0), [manualDeposits])
  const paystackCredits = useMemo(() => paystackDeposits.reduce((sum: number, d: Deposit) => sum + toNum(d.amount), 0), [paystackDeposits])

  const filteredDeposits = useMemo(() => {
    return deposits.filter((d: Deposit) => {
      // 1. Text Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        const customerName = (d.customerName || '').toLowerCase()
        const desc = (d.description || '').toLowerCase()
        const ref = (d.reference || '').toLowerCase()
        const recorder = (d.recorderFirstName ? `${d.recorderFirstName} ${d.recorderSurname || ''}` : '').toLowerCase()
        
        const matches = customerName.includes(term) || desc.includes(term) || ref.includes(term) || recorder.includes(term)
        if (!matches) return false
      }

      // 2. Type Filter (All / Manual / Paystack)
      const isPs = isPaystackDeposit(d)
      if (filterType === 'manual' && isPs) return false
      if (filterType === 'paystack' && !isPs) return false

      // 3. Time Filter
      if (timeFilter !== 'all' && d.createdAt) {
        const depositDate = new Date(d.createdAt)
        const now = new Date()

        if (timeFilter === 'today') {
          const isToday = depositDate.toDateString() === now.toDateString()
          if (!isToday) return false
        } else if (timeFilter === 'week') {
          const startOfWeek = new Date(now)
          startOfWeek.setDate(now.getDate() - now.getDay())
          startOfWeek.setHours(0, 0, 0, 0)
          if (depositDate < startOfWeek) return false
        } else if (timeFilter === 'month') {
          const isThisMonth =
            depositDate.getMonth() === now.getMonth() &&
            depositDate.getFullYear() === now.getFullYear()
          if (!isThisMonth) return false
        }
      }

      return true
    })
  }, [deposits, searchTerm, filterType, timeFilter])

  const totalItems = filteredDeposits.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const paginatedDeposits = useMemo(() => {
    return filteredDeposits.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    )
  }, [filteredDeposits, currentPage, pageSize])

  const statsCards = [
    { title: 'Total Deposits', value: formatCurrency(totalCredits), subtitle: `${deposits.length} transactions`, icon: ArrowDownLeft, color: 'text-success' },
    { title: 'Manual Transfers', value: formatCurrency(manualCredits), subtitle: `${manualDeposits.length} transactions`, icon: Landmark, color: 'text-amber-500' },
    { title: 'Paystack Automated', value: formatCurrency(paystackCredits), subtitle: `${paystackDeposits.length} transactions`, icon: ArrowRightLeft, color: 'text-sky-500' },
  ]

  const handleClearFilters = () => {
    setSearchTerm('')
    setFilterType('all')
    setTimeFilter('all')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Deposits Management</h1>
          <p className="text-muted-foreground">View and record customer deposit transactions.</p>
        </div>
        <Button
          className="gradient-primary text-white gap-2 shadow-md hover:shadow-lg transition-all"
          onClick={() => navigate({ to: '/deposits/manual-deposit' as any })}
        >
          <Plus size={16} /> Record Manual Deposit
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {!isLoading && !isError && statsCards.map((card, idx) => (
          <Card key={idx} className="stats-card">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{card.title}</p>
                <p className={`text-xl sm:text-2xl font-bold mt-1 ${card.color || ''}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.subtitle}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/60">
                <card.icon className={`w-6 h-6 ${card.color || 'text-primary'}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Deposit Transactions</CardTitle>
              <CardDescription>All recorded deposits across customers</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Top Search & Time Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search description, reference, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-8"
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

            {/* Time Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1 shrink-0">
                <Filter size={12} /> Range:
              </span>
              {(['all', 'today', 'week', 'month'] as const).map((t) => (
                <Button
                  key={t}
                  variant={timeFilter === t ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs capitalize whitespace-nowrap"
                  onClick={() => setTimeFilter(t)}
                >
                  {t === 'all' ? 'All Time' : t === 'week' ? 'This Week' : t === 'month' ? 'This Month' : 'Today'}
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Method Tabs & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 mb-6">
            <div className="flex items-center gap-2 overflow-x-auto">
              <Button
                variant={filterType === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 gap-2 text-xs font-medium"
                onClick={() => setFilterType('all')}
              >
                All Deposits
                <Badge variant={filterType === 'all' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0 h-4">
                  {deposits.length}
                </Badge>
              </Button>

              <Button
                variant={filterType === 'manual' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 gap-2 text-xs font-medium ${filterType === 'manual' ? '' : 'hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400'}`}
                onClick={() => setFilterType('manual')}
              >
                <Landmark size={13} className={filterType === 'manual' ? 'text-white' : 'text-amber-500'} />
                Manual Transfers
                <Badge variant={filterType === 'manual' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0 h-4">
                  {manualDeposits.length}
                </Badge>
              </Button>

              <Button
                variant={filterType === 'paystack' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 gap-2 text-xs font-medium ${filterType === 'paystack' ? '' : 'hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400'}`}
                onClick={() => setFilterType('paystack')}
              >
                <ArrowRightLeft size={13} className={filterType === 'paystack' ? 'text-white' : 'text-sky-500'} />
                Paystack
                <Badge variant={filterType === 'paystack' ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0 h-4">
                  {paystackDeposits.length}
                </Badge>
              </Button>
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                onClick={handleClearFilters}
              >
                <X size={12} /> Clear Filters
              </Button>
            )}
          </div>

          {isLoading ? (
            <PageLoader message="Loading deposits..." />
          ) : isError ? (
            <PageError message={(error as any)?.message || 'Failed to load'} onRetry={() => refetch()} />
          ) : filteredDeposits.length === 0 ? (
            <PageEmpty
              icon={<Banknote size={24} className="text-muted-foreground" />}
              title={hasFilters ? 'No deposits match your filter criteria' : 'No deposits yet'}
              description={hasFilters ? 'Try clearing or adjusting your search and filter buttons.' : 'Deposit transactions will appear here once recorded.'}
              actionLabel={hasFilters ? 'Clear Filters' : 'Record Deposit'}
              onAction={hasFilters ? handleClearFilters : () => navigate({ to: '/deposits/manual-deposit' as any })}
              hasFilters={hasFilters}
              onClearFilters={handleClearFilters}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Recorded By</TableHead>
                      <TableHead className="text-right">Balance After</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDeposits.map((deposit: Deposit) => {
                      const isPs = isPaystackDeposit(deposit)
                      return (
                        <TableRow
                          key={deposit._id}
                          className="hover:bg-muted/50 transition cursor-pointer"
                          onClick={() => navigate({ to: '/deposits/details' as any, state: { deposit } } as any)}
                        >
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {deposit.createdAt
                              ? new Date(deposit.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                              : '—'}
                          </TableCell>
                          <TableCell className="font-semibold text-success whitespace-nowrap">
                            +{formatCurrency(toNum(deposit.amount))}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {isPs ? (
                              <Badge variant="outline" className="bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20 text-xs font-normal">
                                Paystack
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20 text-xs font-normal">
                                Manual Transfer
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {deposit.description || '—'}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {deposit.reference || '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {deposit.recorderFirstName
                              ? `${deposit.recorderFirstName} ${deposit.recorderSurname || ''}`
                              : isPs ? 'Paystack' : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium whitespace-nowrap">
                            {formatCurrency(toNum(deposit.balanceAfter || 0))}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate({ to: '/deposits/details' as any, state: { deposit } } as any)
                              }}
                            >
                              <Eye size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
