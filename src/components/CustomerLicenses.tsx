import { useState, useRef } from 'react'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import {
  ShieldPlus,
  Pencil,
  Trash2,
  FileText,
  Calendar,
  Loader2,
  Upload,
  Eye,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#/components/ui/dropdown-menu'
import {
  useCustomerLicenses,
  useCreateCustomerLicense,
  useUpdateCustomerLicense,
  useDeleteCustomerLicense,
} from '#/lib/hooks/useCustomerLicenses'
import { uploadFile } from '#/lib/hooks/useCloudinaryUpload'
import type { CustomerLicense } from '#/lib/types'

interface CustomerLicensesProps {
  customerId: number
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-success text-success-foreground text-xs">Approved</Badge>
    case 'rejected':
      return <Badge variant="destructive" className="text-xs">Rejected</Badge>
    case 'pending':
    default:
      return <Badge className="bg-warning text-warning-foreground text-xs">Pending</Badge>
  }
}

export function CustomerLicenses({ customerId }: CustomerLicensesProps) {
  const { data: licenses = [], isLoading } = useCustomerLicenses(customerId)
  const createLicense = useCreateCustomerLicense()
  const updateLicense = useUpdateCustomerLicense()
  const deleteLicense = useDeleteCustomerLicense()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLicense, setEditingLicense] = useState<CustomerLicense | null>(null)
  const [previewLicense, setPreviewLicense] = useState<CustomerLicense | null>(null)

  const [companyName, setCompanyName] = useState('')
  const [licenseUrl, setLicenseUrl] = useState('')
  const [licensePublicId, setLicensePublicId] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const openAddDialog = () => {
    setEditingLicense(null)
    setCompanyName('')
    setLicenseUrl('')
    setLicensePublicId('')
    setExpiryDate('')
    setErrors({})
    setDialogOpen(true)
  }

  const openEditDialog = (license: CustomerLicense) => {
    setEditingLicense(license)
    setCompanyName(license.companyName)
    setLicenseUrl(license.licenseUrl)
    setLicensePublicId(license.licensePublicId)
    setExpiryDate(license.expiryDate || '')
    setErrors({})
    setDialogOpen(true)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setErrors((prev) => {
      const next = { ...prev }
      delete next.licenseFile
      return next
    })

    try {
      const result = await uploadFile(file, 'soroman/licenses')
      setLicenseUrl(result.url)
      setLicensePublicId(result.publicId)
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        licenseFile: err.message || 'Upload failed',
      }))
    } finally {
      setIsUploading(false)
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!companyName.trim()) newErrors.companyName = 'Company name is required'
    if (!licenseUrl && !editingLicense)
      newErrors.licenseFile = 'License file is required'
    return newErrors
  }

  const handleSubmit = async () => {
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      if (editingLicense) {
        await updateLicense.mutateAsync({
          id: editingLicense.id,
          data: {
            companyName,
            licenseUrl: licenseUrl || undefined,
            licensePublicId: licensePublicId || undefined,
            expiryDate: expiryDate || '',
          },
          customerId,
        })
      } else {
        await createLicense.mutateAsync({
          customerId,
          companyName,
          licenseUrl,
          licensePublicId,
          expiryDate: expiryDate || '',
        })
      }
      setDialogOpen(false)
    } catch {
      // Errors handled by mutation hooks
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (license: CustomerLicense) => {
    if (!confirm(`Delete license for "${license.companyName}"?`)) return
    await deleteLicense.mutateAsync({ id: license.id, customerId })
  }

  const isImage = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url) || url.includes('/image/')

  const isPdf = (url: string) =>
    url.endsWith('.pdf') || url.includes('/raw/')

  const willResetStatus =
    editingLicense && editingLicense.status !== 'pending'

  return (
    <div className="space-y-4 border rounded-lg p-5 bg-card">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center space-x-2">
          <ShieldPlus className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">DPR / NUPRC License</h2>
        </div>
        <Button size="sm" onClick={openAddDialog}>
          <ShieldPlus className="size-4 mr-1.5" />
          Add License
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="size-4 animate-spin" />
          Loading licenses...
        </div>
      ) : licenses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ShieldPlus className="size-10 mx-auto mb-2 opacity-30" />
          <p>No licenses added yet</p>
          <p className="text-sm">
            Click &quot;Add License&quot; to attach a DPR/NUPRC license
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {licenses.map((license) => (
            <div
              key={license.id}
              className="flex flex-col gap-3 p-4 rounded-lg border bg-muted/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{license.companyName}</p>
                      {getStatusBadge(license.status)}
                    </div>
                    {license.expiryDate && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <Calendar className="size-3.5" />
                        Expires:{' '}
                        {new Date(license.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    {license.licenseUrl && (
                      <DropdownMenuItem onClick={() => setPreviewLicense(license)}>
                        <Eye className="mr-2 size-4 text-muted-foreground" />
                        Preview
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => openEditDialog(license)}>
                      <Pencil className="mr-2 size-4 text-muted-foreground" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      onClick={() => handleDelete(license)}
                    >
                      <Trash2 className="mr-2 size-4 text-destructive" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Inline Full Image Display */}
              {license.licenseUrl && isImage(license.licenseUrl) && (
                <div className="overflow-hidden rounded-lg border bg-background flex justify-center mt-1">
                  <img
                    src={license.licenseUrl}
                    alt={license.companyName}
                    className="w-full max-h-96 object-contain cursor-pointer hover:opacity-95 transition-opacity duration-250 ease-luxe"
                    onClick={() => setPreviewLicense(license)}
                  />
                </div>
              )}
              {license.licenseUrl && isPdf(license.licenseUrl) && (
                <div className="p-3 border rounded-lg bg-background flex items-center justify-between text-sm mt-1">
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-primary" />
                    <span className="font-normal text-muted-foreground">PDF Document</span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => setPreviewLicense(license)}
                  >
                    View PDF
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLicense ? 'Edit License' : 'Add DPR/NUPRC License'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {willResetStatus && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-warning/50 bg-warning/10 text-warning-foreground">
                <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                <p className="text-sm">
                  Editing this license will reset its verification status from{' '}
                  <span className="font-semibold">{editingLicense.status}</span> back to{' '}
                  <span className="font-semibold">pending</span>. An admin will need to re-verify it.
                </p>
              </div>
            )}

            <div>
              <Label>Company Name *</Label>
              <Input
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value)
                  if (errors.companyName)
                    setErrors((p) => {
                      const n = { ...p }
                      delete n.companyName
                      return n
                    })
                }}
                placeholder="e.g. Dangote Industries Ltd"
                className={errors.companyName ? 'border-destructive' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive mt-1">
                  {errors.companyName}
                </p>
              )}
            </div>

            <div>
              <Label>License File *</Label>
              <div className="mt-1">
                {licenseUrl ? (
                  <div className="space-y-2">
                    {isImage(licenseUrl) ? (
                      <img
                        src={licenseUrl}
                        alt="License preview"
                        className="max-h-48 rounded border object-contain"
                      />
                    ) : isPdf(licenseUrl) ? (
                      <div className="flex items-center gap-2 p-3 border rounded bg-muted/50">
                        <FileText className="size-5 text-primary" />
                        <span className="text-sm">PDF file attached</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 border rounded bg-muted/50">
                        <FileText className="size-5 text-primary" />
                        <span className="text-sm">File attached</span>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="size-4 animate-spin mr-1.5" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="size-4 mr-1.5" />
                          Replace File
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isUploading
                        ? 'border-primary/50 bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => {
                      if (!isUploading) fileInputRef.current?.click()
                    }}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="size-8 mx-auto mb-2 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">
                          Uploading to Cloudinary...
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload license file
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Images and PDF files accepted
                        </p>
                      </>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {errors.licenseFile && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.licenseFile}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : editingLicense ? (
                'Update License'
              ) : (
                'Add License'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewLicense}
        onOpenChange={(open) => {
          if (!open) setPreviewLicense(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {previewLicense?.companyName} — License
            </DialogTitle>
          </DialogHeader>
          {previewLicense?.licenseUrl &&
            (isImage(previewLicense.licenseUrl) ? (
              <img
                src={previewLicense.licenseUrl}
                alt="License"
                className="max-h-[70svh] rounded object-contain mx-auto"
              />
            ) : isPdf(previewLicense.licenseUrl) ? (
              <iframe
                src={previewLicense.licenseUrl}
                className="w-full h-[70svh] rounded border"
                title="License PDF"
              />
            ) : (
              <div className="flex items-center gap-2 p-4 border rounded">
                <FileText className="size-5" />
                <span>Unsupported file format</span>
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </div>
  )
}
