import { useState, useRef } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import {
  Loader2,
  ShieldPlus,
  FileText,
  Calendar,
  Upload,
  CheckCircle2,
} from 'lucide-react'
import { uploadFile } from '#/lib/hooks/useCloudinaryUpload'
import type { DangoteOrderWizardReturn } from '../../hooks/useDangoteOrderWizard'


interface DangoteCompanyLicenseStepProps {
  wizard: DangoteOrderWizardReturn
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-success text-success-foreground text-xs">Approved</Badge>
    case 'pending':
      return <Badge className="bg-warning text-warning-foreground text-xs">Pending</Badge>
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>
  }
}

export function DangoteCompanyLicenseStep({ wizard }: DangoteCompanyLicenseStepProps) {
  const {
    selectedLicense,
    setSelectedLicense,
    isAddingLicense,
    setIsAddingLicense,
    newLicenseForm,
    setNewLicenseForm,
    customerLicenses,
    isLoadingLicenses,
    createLicenseMutation,
    handleAddLicense,
  } = wizard

  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const result = await uploadFile(file, 'soroman/licenses')
      setNewLicenseForm({ ...newLicenseForm, licenseUrl: result.url, licensePublicId: result.publicId })
    } catch {
      // Error handled silently, user can retry
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const isImage = (url: string) =>
    /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url) || url.includes('/image/')

  return (
    <div key="dangote-step-2" className="space-y-6 animate-fade-in">

      {/* Loading state */}
      {isLoadingLicenses ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : isAddingLicense ? (
        /* ── Inline Add Licence Form ── */
        <div className="space-y-4 border p-5 rounded-xl bg-card">
          <div className="flex justify-between items-center border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded bg-primary/10 flex items-center justify-center">
                <ShieldPlus className="text-primary size-3.5" />
              </div>
              <span className="font-semibold text-sm">Add New Company & Licence</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => {
              setIsAddingLicense(false)
              setNewLicenseForm({ companyName: '', licenseUrl: '', licensePublicId: '', expiryDate: '' })
            }}>
              Cancel
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input
                placeholder="e.g. Dangote Industries Ltd"
                value={newLicenseForm.companyName}
                onChange={(e) => setNewLicenseForm({ ...newLicenseForm, companyName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={newLicenseForm.expiryDate}
                onChange={(e) => setNewLicenseForm({ ...newLicenseForm, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Licence File *</Label>
            {newLicenseForm.licenseUrl ? (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                {isImage(newLicenseForm.licenseUrl) ? (
                  <img src={newLicenseForm.licenseUrl} alt="Licence" className="size-12 rounded object-cover border" />
                ) : (
                  <FileText className="size-8 text-primary" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">File uploaded</p>
                  <p className="text-xs text-muted-foreground truncate">{newLicenseForm.licenseUrl}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? <Loader2 className="size-4 animate-spin" /> : 'Replace'}
                </Button>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
 isUploading ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/50'
 }`}
                onClick={() => { if (!isUploading) fileInputRef.current?.click() }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-8 mx-auto mb-2 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="size-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload licence file</p>
                    <p className="text-xs text-muted-foreground mt-1">Images and PDF files accepted</p>
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
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button variant="outline" onClick={() => {
              setIsAddingLicense(false)
              setNewLicenseForm({ companyName: '', licenseUrl: '', licensePublicId: '', expiryDate: '' })
            }}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground border-0"
              onClick={handleAddLicense}
              disabled={createLicenseMutation.isPending || isUploading}
            >
              {createLicenseMutation.isPending ? (
                <><Loader2 className="size-4 animate-spin mr-2" />Saving...</>
              ) : (
                'Save & Select'
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* ── Licence List ── */
        <div className="space-y-4">
          {customerLicenses.length === 0 ? (
            <div className="p-10 text-center border border-dashed rounded-xl bg-muted/20">
              <div className="inline-flex size-12 items-center justify-center rounded-xl bg-muted border border-border mb-3">
                <ShieldPlus className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No licences found</p>
              <p className="text-xs text-muted-foreground mt-1">
                This customer doesn't have any company licences yet.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingLicense(true)} className="mt-3 text-primary">
                <ShieldPlus className="size-3.5 mr-1" /> Add Your First Licence
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {customerLicenses.map((license) => {
                  const isSelected = selectedLicense?.id === license.id
                  return (
                    <div
                      key={license.id}
                      onClick={() => setSelectedLicense(license)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col gap-3 ${
 isSelected
 ? 'border-primary bg-primary/5 '
 : 'hover:bg-muted/50 hover:border-muted-foreground/20 border-border'
 }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${
 isSelected ? 'bg-primary/20' : 'bg-muted'
 }`}>
                            <FileText className={`size-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground truncate">{license.companyName}</p>
                            {license.expiryDate && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="size-3" />
                                Expires: {new Date(license.expiryDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {getStatusBadge(license.status)}
                          {isSelected && (
                            <CheckCircle2 className="size-4 text-primary" />
                          )}
                        </div>
                      </div>
                      {license.licenseUrl && isImage(license.licenseUrl) && (
                        <div className="overflow-hidden rounded-lg border bg-background">
                          <img
                            src={license.licenseUrl}
                            alt={license.companyName}
                            className="w-full h-24 object-cover"
                          />
                        </div>
                      )}
                      {license.licenseUrl && !isImage(license.licenseUrl) && (
                        <div className="flex items-center gap-2 p-2 border rounded-lg bg-background text-xs">
                          <FileText className="size-4 text-primary shrink-0" />
                          <span className="text-muted-foreground truncate">PDF Document</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-center pt-2">
                <Button variant="outline" onClick={() => setIsAddingLicense(true)} className="text-primary">
                  <ShieldPlus className="size-3.5 mr-1.5" /> Add New Company + Licence
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
