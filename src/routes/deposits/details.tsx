import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/ui/card'
import { ArrowLeft, AlertCircle, DollarSign, ArrowDownLeft, Calendar, User, Building2, Phone, Hash, FileText, Clock, Landmark, CreditCard, Globe, Send, ShieldCheck, Banknote, ArrowRightLeft, Info } from 'lucide-react'
import type { Deposit } from '#/lib/hooks/useDeposits'
import { toNum } from '#/lib/utils'

export const Route = createFileRoute('/deposits/details')({
  component: DepositDetailPage,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value)
}

function DepositDetailPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const deposit = (router.history.location.state as any)?.deposit as Deposit | undefined

  const handleBack = () => {
    window.history.length > 1 ? window.history.back() : navigate({ to: '/deposits/' as any })
  }

  if (!deposit) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">No Deposit Selected</h2>
        <p className="text-muted-foreground max-w-sm">Please select a deposit from the list to view its details.</p>
        <Button onClick={() => navigate({ to: '/deposits/' as any })}>
          <ArrowLeft size={16} /> Back to Deposits
        </Button>
      </div>
    )
  }

  const ps = deposit.paystackDetails as Record<string, any> | null | undefined

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Deposit Details</h1>
            <p className="text-muted-foreground">Transaction details and customer information</p>
          </div>
        </div>
      </header>

      <Card className="card-hover">
        <CardContent className="p-6 md:p-8 bg-gradient-to-r from-primary/5 to-success/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg shrink-0 bg-success text-success-foreground">
              <ArrowDownLeft size={36} />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-success text-success-foreground">
                  Deposit
                </Badge>
                {deposit.reference && (
                  <Badge variant="outline" className="font-mono text-xs">Ref: {deposit.reference}</Badge>
                )}
                {ps?.channel && (
                  <Badge variant="outline" className="font-mono text-xs capitalize">{String(ps.channel).replace(/_/g, ' ')}</Badge>
                )}
              </div>
              <p className="text-3xl font-bold mt-2 text-success">
                +{formatCurrency(toNum(deposit.amount))}
              </p>
              {deposit.customerName && (
                <p className="text-muted-foreground mt-1.5 text-sm flex items-center gap-1.5">
                  <User size={14} className="shrink-0" />
                  {deposit.customerName}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Calendar size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Transaction Info</CardTitle>
                <CardDescription className="text-xs">Date, type, and reference</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Date & Time</p>
              <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                <Clock size={14} className="text-muted-foreground" />
                {deposit.createdAt
                  ? new Date(deposit.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Transaction Type</p>
              <div className="mt-1">
                <Badge className="bg-success text-success-foreground gap-1">
                  <ArrowDownLeft size={12} /> Deposit (Credit)
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reference</p>
              <p className="text-sm text-foreground mt-0.5 font-mono flex items-center gap-1.5">
                <Hash size={14} className="text-muted-foreground" />
                {deposit.reference || 'No reference provided'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Recorded By</p>
              <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                <User size={14} className="text-muted-foreground" />
                {deposit.recorderFirstName
                  ? `${deposit.recorderFirstName} ${deposit.recorderSurname || ''}`
                  : 'System'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center text-info">
                <User size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Customer Info</CardTitle>
                <CardDescription className="text-xs">Associated customer details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Customer Name</p>
              <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                <User size={14} className="text-muted-foreground" />
                {deposit.customerName || 'Unknown Customer'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone</p>
              <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                <Phone size={14} className="text-muted-foreground" />
                {deposit.customerPhone || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Company</p>
              <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                <Building2 size={14} className="text-muted-foreground" />
                {deposit.customerCompanyName || '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                <DollarSign size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Financial Details</CardTitle>
                <CardDescription className="text-xs">Amount and balance information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Amount</p>
              <p className="text-2xl font-bold mt-1 text-success">
                +{formatCurrency(toNum(deposit.amount))}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Balance After</p>
              <p className="text-lg font-bold text-foreground mt-0.5 font-mono">
                {formatCurrency(toNum(deposit.balanceAfter || 0))}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                <FileText size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">System Info</CardTitle>
                <CardDescription className="text-xs">Record identifiers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Deposit ID</p>
              <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate select-all">{deposit.id || deposit._id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Last Updated</p>
              <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                <Clock size={14} className="text-muted-foreground" />
                {deposit.updatedAt
                  ? new Date(deposit.updatedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        {deposit.description && (
          <Card className="md:col-span-2">
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                  <FileText size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm">Description</CardTitle>
                  <CardDescription className="text-xs">Transaction notes and details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-sm text-foreground whitespace-pre-wrap">{deposit.description}</p>
            </CardContent>
          </Card>
        )}

        {/* ── Paystack Payment Details ── */}
        {ps && (
          <Card className="md:col-span-2 border-primary/20">
            <CardHeader className="border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                  <Landmark size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm">Paystack Payment Details</CardTitle>
                  <CardDescription className="text-xs">Full transaction details from Paystack</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                {/* Sender Name */}
                {ps.senderName && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Send size={12} /> Sender Name
                    </p>
                    <p className="text-sm font-semibold text-foreground">{String(ps.senderName)}</p>
                  </div>
                )}

                {/* Sender Bank */}
                {ps.senderBankName && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Landmark size={12} /> Sender Bank
                    </p>
                    <p className="text-sm font-semibold text-foreground">{String(ps.senderBankName)}</p>
                  </div>
                )}

                {/* Sender Account Number */}
                {ps.senderAccountNumber && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={12} /> Sender Account
                    </p>
                    <p className="text-sm font-mono font-semibold text-foreground">
                      {String(ps.senderAccountNumber).length <= 4
                        ? `****${ps.senderAccountNumber}`
                        : String(ps.senderAccountNumber)}
                    </p>
                  </div>
                )}

                {/* Receiver Bank */}
                {ps.receiverBankName && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Landmark size={12} /> Receiver Bank
                    </p>
                    <p className="text-sm font-semibold text-foreground">{String(ps.receiverBankName)}</p>
                  </div>
                )}

                {/* Receiver Account Number */}
                {ps.receiverAccountNumber && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard size={12} /> Receiver Account
                    </p>
                    <p className="text-sm font-mono font-semibold text-foreground">{String(ps.receiverAccountNumber)}</p>
                  </div>
                )}

                {/* Receiver Account Name */}
                {ps.receiverAccountName && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <User size={12} /> Receiver Account Name
                    </p>
                    <p className="text-sm font-semibold text-foreground">{String(ps.receiverAccountName)}</p>
                  </div>
                )}

                {/* Channel */}
                {ps.channel && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <ArrowRightLeft size={12} /> Payment Channel
                    </p>
                    <Badge variant="outline" className="font-mono text-xs capitalize mt-0.5">
                      {String(ps.channel).replace(/_/g, ' ')}
                    </Badge>
                  </div>
                )}

                {/* Currency */}
                {ps.currency && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Banknote size={12} /> Currency
                    </p>
                    <p className="text-sm font-semibold text-foreground">{String(ps.currency)}</p>
                  </div>
                )}

                {/* Fees */}
                {ps.fees != null && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign size={12} /> Paystack Fees
                    </p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(ps.fees))}</p>
                  </div>
                )}

                {/* Gateway Response */}
                {ps.gatewayResponse && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={12} /> Gateway Response
                    </p>
                    <Badge
                      className={
                        String(ps.gatewayResponse).toLowerCase() === 'successful'
                          ? 'bg-success text-success-foreground'
                          : 'bg-warning text-warning-foreground'
                      }
                    >
                      {String(ps.gatewayResponse)}
                    </Badge>
                  </div>
                )}

                {/* Transaction Status */}
                {ps.status && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Info size={12} /> Transaction Status
                    </p>
                    <Badge
                      className={
                        String(ps.status).toLowerCase() === 'success'
                          ? 'bg-success text-success-foreground'
                          : 'bg-warning text-warning-foreground'
                      }
                    >
                      {String(ps.status)}
                    </Badge>
                  </div>
                )}

                {/* Sender Country */}
                {ps.senderCountry && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Globe size={12} /> Sender Country
                    </p>
                    <p className="text-sm font-semibold text-foreground">{String(ps.senderCountry)}</p>
                  </div>
                )}

                {/* Sender Narration */}
                {ps.senderNarration && (
                  <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={12} /> Sender Narration
                    </p>
                    <p className="text-sm text-foreground">{String(ps.senderNarration)}</p>
                  </div>
                )}

                {/* Paystack Transaction ID */}
                {ps.transactionId && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Hash size={12} /> Paystack Transaction ID
                    </p>
                    <p className="text-xs font-mono text-muted-foreground select-all">{String(ps.transactionId)}</p>
                  </div>
                )}

                {/* Paystack Customer Code */}
                {ps.paystackCustomerCode && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Hash size={12} /> Paystack Customer Code
                    </p>
                    <p className="text-xs font-mono text-muted-foreground select-all">{String(ps.paystackCustomerCode)}</p>
                  </div>
                )}

                {/* Paid At */}
                {ps.paidAt && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={12} /> Paid At
                    </p>
                    <p className="text-sm text-foreground">
                      {new Date(String(ps.paidAt)).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}

                {/* IP Address */}
                {ps.ipAddress && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Globe size={12} /> IP Address
                    </p>
                    <p className="text-xs font-mono text-muted-foreground select-all">{String(ps.ipAddress)}</p>
                  </div>
                )}

                {/* Domain */}
                {ps.domain && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                      <Info size={12} /> Domain
                    </p>
                    <Badge variant="outline" className="text-xs capitalize">{String(ps.domain)}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
