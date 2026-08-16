import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Loader2, Save, CheckCircle, AlertCircle, FileText, Banknote, Users, Ship,
} from 'lucide-react'

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { NativeSelect } from '#/components/ui/native-select'
import { CommaInput } from '#/components/ui/comma-input'
import { PageLoader } from '#/components/PageLoader'
import { MICRO, PANEL, PANEL_RAIL, PANEL_BODY } from '#/lib/panel'
import { cn, getErrorMessage } from '#/lib/utils'
import {
  useCreatePfi, useUpdatePfi, useDepotsForFilter, usePfiDetails,
} from '#/lib/hooks/usePfis'
import { useProductList } from '#/lib/hooks/useProducts'
import { useAdminList } from '#/lib/hooks/useAdmin'
import { routeGuard } from '#/lib/route-guard'
import { naira, SurplusDeficit } from '#/routes/pfi/-pfi-utils'

export const Route = createFileRoute('/pfi/form')({
  beforeLoad: () => routeGuard('/pfi'),
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || '',
  }),
  component: PFIForm,
})

const EMPTY_FORM = {
  id: '',
  pfiDate: '',
  pfiNumber: '',
  description: '',
  locationId: '',
  productId: '',
  productUnit: '',
  startingQtyLitres: '',
  qtyVolumeMt: '',
  blQtyLitres: '',
  blQtyMt: '',
  unitPrice: '',
  creditBalance: '',
  auditOfficerId: '',
  productOfficerId: '',
  itComplianceOfficerId: '',
  securityExitOfficerId: '',
  commissionOfficerId: '',
  salesManagerId: '',
  vesselBroker: '',
  vesselName: '',
  surveyorName: '',
  surveyorPhone: '',
}

type FormState = typeof EMPTY_FORM

const OFFICER_FIELDS: Array<{ label: string; key: keyof FormState }> = [
  { label: 'Audit Officer', key: 'auditOfficerId' },
  { label: 'Product Officer', key: 'productOfficerId' },
  { label: 'IT Compliance Officer', key: 'itComplianceOfficerId' },
  { label: 'Security Exit Officer', key: 'securityExitOfficerId' },
  { label: 'Commission Officer', key: 'commissionOfficerId' },
  { label: 'Sales Manager', key: 'salesManagerId' },
]

function formatDateToInput(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().substring(0, 10)
  } catch {
    return ''
  }
}

/** Field-level messages from a Zod validation failure — `{errors:[{path,message}]}`. */
function getFieldErrors(err: any): Record<string, string> {
  const errors = err?.response?.data?.errors
  if (!Array.isArray(errors)) return {}
  const map: Record<string, string> = {}
  for (const e of errors) {
    if (e?.path && e?.message) map[String(e.path)] = String(e.message)
  }
  return map
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

function Field({
  label, required, hint, error, children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error ? <FieldError message={error} /> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function Section({
  icon, title, description, children,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className={PANEL}>
      <div className={PANEL_RAIL}>
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
          <div>
            <p className="text-sm font-normal">{title}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
      </div>
      <div className={cn(PANEL_BODY, 'space-y-4')}>{children}</div>
    </section>
  )
}

function PFIForm() {
  const navigate = useNavigate()
  const { id } = Route.useSearch()
  const isEdit = !!id
  const createPfi = useCreatePfi()
  const updatePfi = useUpdatePfi()

  const { data: editingPfi, isLoading: isLoadingPfi } = usePfiDetails(id)

  const { data: statesData } = useDepotsForFilter()
  const { data: productsData } = useProductList()
  const { data: adminsData } = useAdminList()

  const depots = Array.isArray(statesData) ? statesData : ((statesData as any)?.depots || (statesData as any)?.results || [])
  const products = Array.isArray(productsData) ? productsData : ((productsData as any)?.products || (productsData as any)?.results || [])
  const staff = Array.isArray(adminsData) ? adminsData : []

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (isEdit && editingPfi) {
      setForm({
        id: String(editingPfi._id || editingPfi.id || ''),
        pfiDate: formatDateToInput(editingPfi.pfiDate),
        pfiNumber: editingPfi.pfiNumber || '',
        description: editingPfi.description || '',
        locationId: editingPfi.locationId ? String(editingPfi.locationId) : '',
        productId: editingPfi.productId ? String(editingPfi.productId) : '',
        productUnit: editingPfi.productUnit || '',
        startingQtyLitres: editingPfi.startingQtyLitres != null ? String(editingPfi.startingQtyLitres) : '',
        qtyVolumeMt: editingPfi.qtyVolumeMt != null ? String(editingPfi.qtyVolumeMt) : '',
        blQtyLitres: editingPfi.blQtyLitres != null ? String(editingPfi.blQtyLitres) : '',
        blQtyMt: editingPfi.blQtyMt != null ? String(editingPfi.blQtyMt) : '',
        unitPrice: editingPfi.unitPrice != null ? String(editingPfi.unitPrice) : '',
        creditBalance: editingPfi.creditBalance != null ? String(editingPfi.creditBalance) : '',
        auditOfficerId: editingPfi.auditOfficerId ? String(editingPfi.auditOfficerId) : '',
        productOfficerId: editingPfi.productOfficerId ? String(editingPfi.productOfficerId) : '',
        itComplianceOfficerId: editingPfi.itComplianceOfficerId ? String(editingPfi.itComplianceOfficerId) : '',
        securityExitOfficerId: editingPfi.securityExitOfficerId ? String(editingPfi.securityExitOfficerId) : '',
        commissionOfficerId: editingPfi.commissionOfficerId ? String(editingPfi.commissionOfficerId) : '',
        salesManagerId: editingPfi.salesManagerId ? String(editingPfi.salesManagerId) : '',
        vesselBroker: editingPfi.vesselBroker || '',
        vesselName: editingPfi.vesselName || '',
        surveyorName: editingPfi.surveyorName || '',
        surveyorPhone: editingPfi.surveyorPhone || '',
      })
    }
  }, [isEdit, editingPfi])

  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // The live preview: appears as soon as either figure is entered, because
  // that's the earliest point a surplus/deficit or a cargo value means
  // anything — waiting for both fields to be complete would hide the number
  // exactly when someone is checking it against the papers as they type.
  const preview = useMemo(() => {
    const bl = form.blQtyLitres === '' ? null : Number(form.blQtyLitres)
    const tank = form.startingQtyLitres === '' ? null : Number(form.startingQtyLitres)
    const price = form.unitPrice === '' ? null : Number(form.unitPrice)
    return {
      show: bl != null || tank != null,
      surplusDeficit: bl != null && tank != null ? tank - bl : null,
      pfiValue: bl != null && price != null ? bl * price : null,
    }
  }, [form.blQtyLitres, form.startingQtyLitres, form.unitPrice])

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setError('')
    setFieldErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const nextErrors: Record<string, string> = {}
    if (!form.pfiNumber.trim()) nextErrors.pfiNumber = 'PFI number is required.'
    if (!form.locationId) nextErrors.locationId = 'Location is required.'
    if (!form.productId) nextErrors.productId = 'Product is required.'
    if (!form.startingQtyLitres || Number(form.startingQtyLitres) <= 0) {
      nextErrors.startingQtyLitres = 'Quantity (Ltr) is required and must be greater than 0.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setError('Please fix the highlighted fields.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        pfiDate: form.pfiDate || null,
        pfiNumber: form.pfiNumber.trim(),
        description: form.description,
        locationId: form.locationId || null,
        productId: form.productId,
        productUnit: form.productUnit || undefined,
        startingQtyLitres: Number(form.startingQtyLitres) || 0,
        qtyVolumeMt: form.qtyVolumeMt === '' ? null : Number(form.qtyVolumeMt),
        // Blank means unknown, not zero — a false 0 would make every
        // downstream money figure compute against it instead of reading "—".
        blQtyLitres: form.blQtyLitres === '' ? null : Number(form.blQtyLitres),
        blQtyMt: form.blQtyMt === '' ? null : Number(form.blQtyMt),
        unitPrice: form.unitPrice === '' ? 0 : Number(form.unitPrice),
        creditBalance: form.creditBalance === '' ? 0 : Number(form.creditBalance),
        auditOfficerId: form.auditOfficerId || null,
        productOfficerId: form.productOfficerId || null,
        itComplianceOfficerId: form.itComplianceOfficerId || null,
        securityExitOfficerId: form.securityExitOfficerId || null,
        commissionOfficerId: form.commissionOfficerId || null,
        salesManagerId: form.salesManagerId || null,
        vesselBroker: form.vesselBroker || null,
        vesselName: form.vesselName || null,
        surveyorName: form.surveyorName || null,
        surveyorPhone: form.surveyorPhone || null,
      }

      if (isEdit && form.id) {
        await updatePfi.mutateAsync({ id: form.id, data: payload })
      } else {
        await createPfi.mutateAsync(payload)
      }
      setSubmitted(true)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 409) {
        const msg = err?.response?.data?.message || 'A PFI with this number already exists.'
        setFieldErrors({ pfiNumber: msg })
        setError(msg)
      } else {
        const apiFieldErrors = getFieldErrors(err)
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors(apiFieldErrors)
          setError('Please fix the highlighted fields.')
        } else {
          setError(getErrorMessage(err) || 'Failed to save PFI details')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isEdit && isLoadingPfi) return <PageLoader />

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
          <CheckCircle className="size-8" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          PFI {isEdit ? 'updated' : 'registered'} successfully
        </h2>
        <p className="max-w-sm text-muted-foreground">
          Pro Forma Invoice {form.pfiNumber} has been saved.
        </p>
        <div className="mt-2 flex gap-3">
          {!isEdit && (
            <Button variant="outline" onClick={() => { setSubmitted(false); resetForm() }}>
              Add another
            </Button>
          )}
          <Button onClick={() => navigate({ to: '/pfi' })}>Back to PFI list</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        eyebrow="Admin"
        title={isEdit ? 'Edit PFI' : 'Add New PFI'}
        description={isEdit ? 'Modify quantities, cost, officers and vessel details for this PFI.' : 'Register a new PFI.'}
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-1">
          <div className="space-y-6">
            <Section icon={<FileText />} title="Identity" description="What this batch is and where it's going.">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date">
                  <Input type="date" value={form.pfiDate} onChange={(e) => set('pfiDate', e.target.value)} />
                </Field>
                <Field label="PFI No" required error={fieldErrors.pfiNumber}>
                  <Input
                    placeholder="e.g. PFI-50" value={form.pfiNumber}
                    aria-invalid={!!fieldErrors.pfiNumber}
                    onChange={(e) => set('pfiNumber', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Description">
                <Input
                  placeholder="e.g. PMS" value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Location" required error={fieldErrors.locationId}>
                  <NativeSelect
                    value={form.locationId} aria-invalid={!!fieldErrors.locationId}
                    onChange={(e) => set('locationId', e.target.value)}
                  >
                    <option value="">Select location</option>
                    {depots.map((d: any) => (
                      <option key={d.id || d._id} value={String(d.id || d._id)}>
                        {d.name}{d.code ? ` (${d.code})` : ''}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Product" required error={fieldErrors.productId}>
                  <NativeSelect
                    value={form.productId} aria-invalid={!!fieldErrors.productId}
                    onChange={(e) => {
                      const v = e.target.value
                      const selected = products.find((p: any) => String(p.id || p._id) === v)
                      setForm((f) => ({ ...f, productId: v, productUnit: selected?.unit || f.productUnit }))
                    }}
                  >
                    <option value="">Select product</option>
                    {products.map((p: any) => (
                      <option key={p.id || p._id} value={String(p.id || p._id)}>
                        {p.name}{p.unit ? ` (${p.unit})` : ''}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Tank Quantity (Litres)" required error={fieldErrors.startingQtyLitres}
                  // hint="The tank figure — what measured into the tank."
                >
                  <CommaInput
                    value={form.startingQtyLitres} aria-invalid={!!fieldErrors.startingQtyLitres}
                    placeholder="e.g. 1,000,000"
                    onValueChange={(v) => set('startingQtyLitres', v)}
                  />
                </Field>
                <Field label="Tank Quantity (MT)">
                  <CommaInput
                    value={form.qtyVolumeMt} placeholder="e.g. 820"
                    onValueChange={(v) => set('qtyVolumeMt', v)}
                  />
                </Field>
              </div>
            </Section>

            <Section icon={<Banknote />} title="Cargo Cost" description="What the shipping papers say you're billed for.">
              <div className="grid grid-cols-2 gap-4">
                <Field label="BL Figures (Litres)">
                  <CommaInput
                    value={form.blQtyLitres} placeholder="e.g. 1,000,000"
                    onValueChange={(v) => set('blQtyLitres', v)}
                  />
                </Field>
                <Field label="BL Figures (MT)">
                  <CommaInput
                    value={form.blQtyMt} placeholder="e.g. 820"
                    onValueChange={(v) => set('blQtyMt', v)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Price per Litre (₦)">
                  <CommaInput
                    value={form.unitPrice} placeholder="e.g. 950.00"
                    onValueChange={(v) => set('unitPrice', v)}
                  />
                </Field>
                <Field
                  label="Credit Balance (₦)"
                  // hint="Rebate, discount or claim credited back. Reduces the grand total cost."
                >
                  <CommaInput
                    value={form.creditBalance} placeholder="0.00"
                    onValueChange={(v) => set('creditBalance', v)}
                  />
                </Field>
              </div>

              {preview.show && (
                <div className="grid grid-cols-2 gap-4 rounded-lg border border-foreground/10 bg-muted/30 p-3">
                  <div>
                    <p className={cn(MICRO, 'text-muted-foreground')}>Surplus/Deficit</p>
                    <div className="mt-1"><SurplusDeficit litres={preview.surplusDeficit} className="text-sm" /></div>
                  </div>
                  <div>
                    <p className={cn(MICRO, 'text-muted-foreground')}>PFI (Cargo) Cost</p>
                    <p className="mt-1 text-sm font-semibold">{naira(preview.pfiValue)}</p>
                  </div>
                </div>
              )}
            </Section>
          </div>

          <div className="space-y-6">
            <Section icon={<Users />} title="Officers" description="Assign staff for each role.">
              <div className="grid grid-cols-2 gap-4">
                {OFFICER_FIELDS.map(({ label, key }) => (
                  <Field key={key} label={label}>
                    <NativeSelect value={form[key]} onChange={(e) => set(key, e.target.value)}>
                      <option value="">Unassigned</option>
                      {staff.map((u: any) => (
                        <option key={u.id} value={String(u.id)}>{u.full_name}</option>
                      ))}
                    </NativeSelect>
                  </Field>
                ))}
              </div>
            </Section>

            <Section icon={<Ship />} title="Vessel & Surveyor" description="Details about the vessel and surveryor">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Vessel Broker">
                  <Input placeholder="Broker name" value={form.vesselBroker} onChange={(e) => set('vesselBroker', e.target.value)} />
                </Field>
                <Field label="Vessel Name">
                  <Input placeholder="e.g. MV Lagos Star" value={form.vesselName} onChange={(e) => set('vesselName', e.target.value)} />
                </Field>
                <Field label="Surveyor Name">
                  <Input placeholder="Surveyor full name" value={form.surveyorName} onChange={(e) => set('surveyorName', e.target.value)} />
                </Field>
                <Field label="Surveyor Phone">
                  <Input type="tel" placeholder="e.g. 08012345678" value={form.surveyorPhone} onChange={(e) => set('surveyorPhone', e.target.value)} />
                </Field>
              </div>
            </Section>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-foreground/10 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/pfi' })}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[9rem]">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save data-icon="inline-start" />}
            {isSubmitting ? 'Saving…' : isEdit ? 'Update PFI' : 'Save PFI'}
          </Button>
        </div>
      </form>
    </div>
  )
}
