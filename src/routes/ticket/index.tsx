import { useState, useEffect, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '#/components/ui/table'
import { Search, X, QrCode, Camera, ShieldCheck, Ticket, CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { Pagination } from '#/components/Pagination'
import { useTicketList } from '#/lib/hooks/useTickets'
import { Html5QrcodeScanner } from 'html5-qrcode'

export const Route = createFileRoute('/ticket/')({
  component: TicketsDashboard,
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'Redeemed':
      return <Badge className="bg-success text-success-foreground">Redeemed</Badge>
    case 'Active':
      return <Badge className="bg-primary text-primary-foreground">Active</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function TicketsDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, isLoading, isError, error, refetch } = useTicketList()
  const tickets = data?.tickets || []
  const hasFilters = !!(searchTerm || selectedStatus !== 'all')

  const totalTickets = tickets.length
  const activeTickets = tickets.filter((t: any) => t.status === 'Active').length
  const redeemedTickets = tickets.filter((t: any) => t.status === 'Redeemed').length
  const redemptionRate = totalTickets > 0 ? Math.round((redeemedTickets / totalTickets) * 100) : 0

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedStatus])

  useEffect(() => {
    if (scanning) {
      // Small timeout to ensure the DOM element #reader is mounted
      const timer = setTimeout(() => {
        try {
          const html5QrcodeScanner = new Html5QrcodeScanner(
            'reader',
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
            },
            /* verbose= */ false
          )

          html5QrcodeScanner.render(
            (decodedText) => {
              // On success, we parse the URL or take the text
              // If it's a URL like http://localhost:3000/ticket/details?id=..., we extract id
              let idOrCode = decodedText
              try {
                if (decodedText.includes('ticket/details')) {
                  const urlObj = new URL(decodedText)
                  idOrCode = urlObj.searchParams.get('id') || decodedText
                }
              } catch (e) {
                // Ignore URL parsing errors
              }

              html5QrcodeScanner.clear().then(() => {
                setScanning(false)
                navigate({ to: '/ticket/details' as any, search: { id: idOrCode } as any })
              }).catch(err => {
                console.error("Failed to clear scanner:", err)
                setScanning(false)
                navigate({ to: '/ticket/details' as any, search: { id: idOrCode } as any })
              })
            },
            (_error) => {
              // Handled internally by library
            }
          )
          scannerRef.current = html5QrcodeScanner
        } catch (err) {
          console.error("Scanner setup failed:", err)
        }
      }, 300)

      return () => {
        clearTimeout(timer)
        if (scannerRef.current) {
          scannerRef.current.clear().catch(err => console.error("Error clearing scanner on unmount:", err))
        }
      }
    }
  }, [scanning, navigate])

  const filteredTickets = tickets.filter((tkt: any) => {
    const matchesSearch =
      !searchTerm ||
      (tkt.ticketNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tkt.order?.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tkt.order?.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      selectedStatus === 'all' || tkt.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const totalItems = filteredTickets.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Ticket className="w-8 h-8 text-primary" /> Tickets
          </h1>
          <p className="text-muted-foreground">Manage automatic receipts, scan QR codes, and redeem customer orders.</p>
        </div>
        <Button
          size="lg"
          className="gradient-primary text-white border-0 shadow-lg cursor-pointer"
          onClick={() => setScanning(!scanning)}
        >
          {scanning ? (
            <>
              <X className="w-5 h-5 mr-2" /> Stop Scanner
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" /> Scan QR Code
            </>
          )}
        </Button>
      </div>

      {/* Statistics Cards */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md border-border/60 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">{totalTickets}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Ticket className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <span>All generated tickets</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md border-border/60 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Active Tickets</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">{activeTickets}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <span>Pending pickup/redemption</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md border-border/60 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Redeemed</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">{redeemedTickets}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <span>Successfully claimed orders</span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md border-border/60 bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Redemption Rate</p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">{`${redemptionRate}%`}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${redemptionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Code Scanner Interface */}
      {scanning && (
        <Card className="border-2 border-primary/30 overflow-hidden shadow-2xl transition-all duration-300">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="text-primary flex items-center gap-2">
              <QrCode className="animate-pulse" /> Live QR Code Reader
            </CardTitle>
            <CardDescription>
              Align the customer's ticket QR code within the frame to auto-scan and load details.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center bg-black/5">
            <div className="w-full max-w-md bg-background rounded-2xl overflow-hidden shadow-inner border border-border p-4 relative">
              <div id="reader" className="w-full overflow-hidden rounded-xl"></div>
              {/* Scanning visual overlay */}
              <div className="absolute top-8 left-8 right-8 h-0.5 bg-primary/70 animate-bounce pointer-events-none" />
            </div>
            <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="text-success" size={14} />
              <span>Scanning is performed locally. Ensure camera access is enabled.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Ticket Directory</CardTitle>
              <CardDescription>Search and manage customer pickup tickets and verify redemptions</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search Ticket, Order, Customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active (Ready)</SelectItem>
                  <SelectItem value="Redeemed">Redeemed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PageLoader message="Loading tickets..." />
          ) : isError ? (
            <PageError message={(error as any)?.message || 'Failed to load'} onRetry={() => refetch()} />
          ) : filteredTickets.length === 0 ? (
            <PageEmpty
              icon={<Ticket size={24} className="text-muted-foreground" />}
              title={hasFilters ? 'No tickets match your filters' : 'No tickets yet'}
              description="Paid or completed orders will automatically generate tickets here."
              hasFilters={hasFilters}
              onClearFilters={() => { setSearchTerm(''); setSelectedStatus('all') }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket No.</TableHead>
                      <TableHead>Order Info</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product / Qty</TableHead>
                      <TableHead>Date Generated</TableHead>
                      <TableHead>Redemption Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTickets.map((tkt: any) => (
                      <TableRow
                        key={tkt._id || tkt.id}
                        className="hover:bg-muted/50 transition cursor-pointer"
                        onClick={() => navigate({ to: '/ticket/details' as any, search: { id: tkt._id || tkt.id } as any })}
                      >
                        <TableCell className="font-mono font-semibold text-primary">
                          {tkt.ticketNumber}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-foreground">{tkt.order?.orderNumber || 'N/A'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium text-foreground">{tkt.order?.customer?.name || 'Unknown'}</p>
                            {tkt.order?.customer?.companyName && (
                              <p className="text-xs text-muted-foreground">{tkt.order.customer.companyName}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm">{tkt.order?.product?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {tkt.order?.quantity?.toLocaleString()} {tkt.order?.product?.unit || 'Liters'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <CalendarDays size={14} />
                            <span>{tkt.createdAt ? new Date(tkt.createdAt).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(tkt.status)}</TableCell>
                      </TableRow>
                    ))}
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
