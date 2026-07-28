import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Search, Loader2, SearchX, ArrowDownLeft, ArrowUpRight, Eye, X, Banknote } from 'lucide-react'
import { useDepositList } from '#/lib/hooks/useDeposits'
import type { Deposit } from '#/lib/hooks/useDeposits'
import { toNum } from '#/lib/utils'

export const Route = createFileRoute('/deposits/')({
  component: DepositsDashboard,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value)
}

function DepositsDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const POLL_INTERVAL = 30_000
  const { data, isLoading } = useDepositList({ limit: 5000, refetchInterval: POLL_INTERVAL })
  const deposits = data?.deposits || []
  const pagination = data?.pagination

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const filteredDeposits = deposits.filter((d: Deposit) => {
    const term = searchTerm.toLowerCase()
    const customerName = (d.customerName || '').toLowerCase()
    return (
      customerName.includes(term) ||
      (d.description || '').toLowerCase().includes(term) ||
      (d.reference || '').toLowerCase().includes(term) ||
      d.type.includes(term)
    )
  })

  const totalItems = filteredDeposits.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedDeposits = filteredDeposits.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const totalCredits = deposits.filter((d: Deposit) => d.type === 'credit').reduce((sum: number, d: Deposit) => sum + toNum(d.amount), 0)

  const statsCards = [
    { title: 'Total Transactions', value: pagination?.total || 0, icon: Banknote },
    { title: 'Total Deposits', value: formatCurrency(totalCredits), icon: ArrowDownLeft, color: 'text-success' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Deposits Management</h1>
        <p className="text-muted-foreground">View all customer deposit transactions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statsCards.map((card, idx) => (
          <Card key={idx} className="stats-card">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color || ''}`}>{card.value}</p>
              </div>
              <card.icon className={`w-8 h-8 ${card.color || 'text-primary'}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Deposit Transactions</CardTitle>
              <CardDescription>All recorded deposits across customers</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by description, reference, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : filteredDeposits.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-border mb-4">
                <SearchX size={24} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No deposits found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Deposit transactions will appear here once recorded.'}
              </p>
              {searchTerm && (
                <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')} className="mt-4 text-primary">
                  <X size={14} /> Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Recorded By</TableHead>
                      <TableHead className="text-right">Balance After</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDeposits.map((deposit: Deposit) => (
                      <TableRow
                        key={deposit.id || deposit._id}
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
                        <TableCell>
                          {deposit.type === 'credit' ? (
                            <Badge className="bg-success text-success-foreground text-xs gap-1">
                              <ArrowDownLeft size={12} />
                              Credit
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs gap-1">
                              <ArrowUpRight size={12} />
                              Debit
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className={`font-semibold ${deposit.type === 'credit' ? 'text-success' : 'text-destructive'}`}>
                          {deposit.type === 'credit' ? '+' : '-'}{formatCurrency(toNum(deposit.amount))}
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
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-medium">
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
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows per page:</span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(val) => {
                      setPageSize(Number(val))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={pageSize.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground ml-4">
                    Showing {totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                    {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                  </p>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    >
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
                        return (
                          <div key={p} className="flex items-center">
                            {showEllipsis && <span className="px-2 text-xs text-muted-foreground">...</span>}
                            <Button
                              variant={currentPage === p ? 'default' : 'outline'}
                              size="sm"
                              className={`h-8 w-8 p-0 ${currentPage === p ? 'gradient-primary text-white border-0' : ''}`}
                              onClick={() => setCurrentPage(p)}
                            >
                              {p}
                            </Button>
                          </div>
                        )
                      })}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
