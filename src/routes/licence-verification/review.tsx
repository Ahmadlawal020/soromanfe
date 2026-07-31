import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Label } from '#/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  User,
  Phone,
  Mail,
  Building2,
  Clock,
  MessageSquare,
} from 'lucide-react'
import { useLicenseDetails, useReviewLicense } from '#/lib/hooks/useCustomerLicenses'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { Breadcrumbs } from '#/components/Breadcrumbs'

export const Route = createFileRoute('/licence-verification/review')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || '',
  }),
  component: LicenceReviewPage,
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-success text-success-foreground">Approved</Badge>
    case 'rejected':
      return <Badge className="bg-destructive text-destructive-foreground">Rejected</Badge>
    case 'pending':
    default:
      return <Badge className="bg-warning text-warning-foreground">Pending</Badge>
  }
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url) || url.includes('/image/')
}

function isPdf(url: string) {
  return url.endsWith('.pdf') || url.includes('/raw/')
}

function LicenceReviewPage() {
  const navigate = useNavigate()
  const { id } = Route.useSearch()
  const { data: license, isLoading, isError, error, refetch } = useLicenseDetails(id)
  const reviewLicense = useReviewLicense()

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve')
  const [reviewComment, setReviewComment] = useState('')

  const handleBack = () => {
    window.history.length > 1
      ? window.history.back()
      : navigate({ to: '/licence-verification/' as any })
  }

  const openReviewDialog = (action: 'approve' | 'reject') => {
    setReviewAction(action)
    setReviewComment('')
    setReviewDialogOpen(true)
  }

  const handleReview = async () => {
    if (!license) return
    await reviewLicense.mutateAsync({
      id: license.id,
      approve: reviewAction === 'approve',
      comment: reviewComment,
    })
    setReviewDialogOpen(false)
    refetch()
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageLoader message="Loading license details..." />
      </div>
    )
  }

  if (isError || !license) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageError
          message={(error as any)?.message || 'Failed to load license'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs
        items={[
          { label: 'Licence Verification', href: '/licence-verification' },
          { label: 'Review' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              License Review
            </h1>
            <p className="text-muted-foreground text-sm">
              {license.companyName}
            </p>
          </div>
        </div>
        {license.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="border-success text-success hover:bg-success/10 hover:text-success"
              onClick={() => openReviewDialog('approve')}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Approve
            </Button>
            <Button
              variant="destructive"
              onClick={() => openReviewDialog('reject')}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Reject
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - License Preview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                License Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              {license.licenseUrl ? (
                isImage(license.licenseUrl) ? (
                  <div className="rounded-lg border bg-background overflow-hidden">
                    <img
                      src={license.licenseUrl}
                      alt={license.companyName}
                      className="w-full max-h-[70vh] object-contain"
                    />
                  </div>
                ) : isPdf(license.licenseUrl) ? (
                  <iframe
                    src={license.licenseUrl}
                    className="w-full h-[70vh] rounded border"
                    title="License PDF"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-8 border rounded-lg justify-center text-muted-foreground">
                    <FileText className="h-5 w-5" />
                    <span>Unsupported file format</span>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 p-8 border rounded-lg justify-center text-muted-foreground">
                  <FileText className="h-5 w-5" />
                  <span>No file uploaded</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Verification Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(license.status)}
              </div>
              {license.verifiedByName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Reviewed by
                  </span>
                  <span className="text-sm font-medium">
                    {license.verifiedByName}
                  </span>
                </div>
              )}
              {license.verifiedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Reviewed at
                  </span>
                  <span className="text-sm">
                    {new Date(license.verifiedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {license.verificationComment && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Comment
                  </div>
                  <p className="text-sm p-3 rounded-lg bg-muted/50 border">
                    {license.verificationComment}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium">
                    {license.customerName || `Customer #${license.customerId}`}
                  </p>
                </div>
              </div>
              {license.customerCompanyName && (
                <div className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm font-medium">
                      {license.customerCompanyName}
                    </p>
                  </div>
                </div>
              )}
              {license.customerPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">
                      {license.customerPhone}
                    </p>
                  </div>
                </div>
              )}
              {license.customerEmail && (
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">
                      {license.customerEmail}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* License Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                License Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Company Name</p>
                <p className="text-sm font-medium">{license.companyName}</p>
              </div>
              {license.expiryDate && (
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Expiry Date
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(license.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Submitted
                </p>
                <p className="text-sm">
                  {new Date(license.createdAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve License' : 'Reject License'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {reviewAction === 'approve'
                ? `Approve license for "${license.companyName}"?`
                : `Reject license for "${license.companyName}"?`}
            </p>
            <div>
              <Label>
                Comment {reviewAction === 'reject' ? '(required)' : '(optional)'}
              </Label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={
                  reviewAction === 'approve'
                    ? 'Optional approval note...'
                    : 'Reason for rejection...'
                }
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
              disabled={reviewLicense.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleReview}
              disabled={
                reviewLicense.isPending ||
                (reviewAction === 'reject' && !reviewComment.trim())
              }
            >
              {reviewLicense.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Processing...
                </>
              ) : reviewAction === 'approve' ? (
                'Approve'
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
