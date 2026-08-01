import { useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  Mail,
  Shield,
  CheckCircle,
  Loader2,
  AlertCircle,
  UserCheck,
  Send,
} from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  ROLE_LABELS,
  ROLE_GROUPS,
} from './-roles'
import { useCreateAdmin, useUpdateAdmin } from '#/modules/admin/hooks/hook'

export const Route = createFileRoute('/admin/form')({
  component: AdminForm,
})

function AdminForm() {
  const navigate = useNavigate()
  const router = useRouter()
  const createAdmin = useCreateAdmin()
  const updateAdmin = useUpdateAdmin()

  const stateData = router.history.location.state as { staff?: any; isEdit?: boolean } | undefined
  const isEdit = stateData?.isEdit || false
  const editingStaff = stateData?.staff

  const nameParts = (editingStaff?.full_name || '').trim().split(/\s+/);
  const initialFirstName = nameParts[0] || '';
  const initialSurname = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const initialOtherNames = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';

  const [formData, setFormData] = useState({
    first_name: editingStaff?.first_name || initialFirstName,
    surname: editingStaff?.surname || initialSurname,
    other_names: editingStaff?.other_names || initialOtherNames,
    email: editingStaff?.email || '',
    phone_number: editingStaff?.phone_number || '',
    roles: (editingStaff?.roles?.length ? editingStaff.roles : [editingStaff?.role ?? 1]) as number[],
    primaryRole: String(editingStaff?.role ?? 1),
    suspended: editingStaff?.suspended ?? false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(ROLE_GROUPS[0].label)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required'
    if (!formData.surname.trim()) newErrors.surname = 'Surname is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    if (formData.phone_number && !/^\d{11}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Phone number must be exactly 11 digits'
    }
    if (formData.roles.length === 0) newErrors.roles = 'At least one role must be assigned'
    return newErrors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData((prev) => ({ ...prev, [name]: val }))
    if (errors[name]) {
      setErrors((prev) => { const next = { ...prev }; delete next[name]; return next })
    }
  }

  const handleRoleToggle = (roleId: number, checked: boolean) => {
    setFormData((prev) => {
      let newRoles: number[]
      if (checked) {
        newRoles = [...prev.roles, roleId]
      } else {
        if (prev.roles.length === 1) return prev
        newRoles = prev.roles.filter((r) => r !== roleId)
      }
      const primaryRole = newRoles.includes(Number(prev.primaryRole)) ? prev.primaryRole : String(newRoles[0])
      return { ...prev, roles: newRoles, primaryRole }
    })
    if (errors.roles) {
      setErrors((prev) => { const next = { ...prev }; delete next.roles; return next })
    }
  }

  const removeRole = (roleId: number) => {
    setFormData((prev) => {
      if (prev.roles.length === 1) return prev
      const newRoles = prev.roles.filter((r) => r !== roleId)
      const primaryRole = newRoles.includes(Number(prev.primaryRole)) ? prev.primaryRole : String(newRoles[0])
      return { ...prev, roles: newRoles, primaryRole }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    try {
      const payload = {
        first_name: formData.first_name.trim(),
        surname: formData.surname.trim(),
        other_names: formData.other_names.trim() || undefined,
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim() || undefined,
        roles: formData.roles,
        suspended: formData.suspended,
      }
      if (isEdit && editingStaff?.id) {
        await updateAdmin.mutateAsync({ id: editingStaff.id, data: payload })
      } else {
        await createAdmin.mutateAsync(payload)
      }
      setSubmitted(true)
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} user. Please try again.`)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="size-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20">
          <CheckCircle className="size-8" />
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">{isEdit ? 'User Updated Successfully!' : 'User Created Successfully!'}</h2>
        <p className="text-muted-foreground max-w-md">
          <span className="font-semibold">{formData.first_name} {formData.surname}</span> has been {isEdit ? 'updated' : 'registered'} with{' '}
          <span className="font-semibold">{formData.roles.length} role{formData.roles.length > 1 ? 's' : ''}</span> assigned.
        </p>
        {!isEdit && (
          <div className="flex items-center gap-2.5 px-5 py-3 rounded-lg bg-primary/10 border border-primary/20">
            <Send className="size-4 text-primary" />
            <p className="text-sm text-foreground">
              A password setup link has been sent to <span className="font-semibold">{formData.email}</span>
            </p>
          </div>
        )}
        <div className="flex gap-3 mt-2">
          {!isEdit && (
            <Button variant="outline" onClick={() => {
              setSubmitted(false)
              setFormData({ first_name: '', surname: '', other_names: '', email: '', phone_number: '', roles: [1], primaryRole: '1', suspended: false })
              setErrors({})
            }}>Add Another</Button>
          )}
          <Button onClick={() => navigate({ to: '/admin/' as any })}>Back to Directory</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/admin/' as any })} className="mb-2">
            <ArrowLeft className="size-4 mr-2" />
            Back to Directory
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-balance">{isEdit ? 'Edit User Account' : 'Create User Account'}</h1>
          <p className="text-muted-foreground">{isEdit ? 'Update user details and role assignments' : 'Register a new system user and assign roles'}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-4 border rounded-lg p-4 lg:col-span-1">
            <div className="flex items-center space-x-2">
              <UserCheck className="size-5 text-primary" />
              <h2 className="text-lg font-medium">Identity & Profile</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>First Name*</Label>
                <Input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="e.g. Aminu" className={errors.first_name ? 'border-destructive' : ''} />
                {errors.first_name && <p className="text-sm text-destructive mt-1">{errors.first_name}</p>}
              </div>
              <div>
                <Label>Surname*</Label>
                <Input name="surname" value={formData.surname} onChange={handleChange} placeholder="e.g. Bello" className={errors.surname ? 'border-destructive' : ''} />
                {errors.surname && <p className="text-sm text-destructive mt-1">{errors.surname}</p>}
              </div>
              <div>
                <Label>Other Names</Label>
                <Input name="other_names" value={formData.other_names} onChange={handleChange} placeholder="e.g. Chukwuemeka" />
              </div>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4 lg:col-span-1">
            <div className="flex items-center space-x-2">
              <Mail className="size-5 text-primary" />
              <h2 className="text-lg font-medium">Contact Details</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Email Address*</Label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="user@soroman.com" className={errors.email ? 'border-destructive' : ''} />
                {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label>Phone Number (11 digits, optional)</Label>
                <Input name="phone_number" type="tel" value={formData.phone_number} onChange={handleChange} placeholder="e.g. 08012345678" maxLength={11} className={errors.phone_number ? 'border-destructive' : ''} />
                {errors.phone_number && <p className="text-sm text-destructive mt-1">{errors.phone_number}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4 lg:col-span-1">
            <div className="flex items-center space-x-2">
              <AlertCircle className="size-5 text-destructive" />
              <h2 className="text-lg font-medium">Account Flags</h2>
            </div>
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <input type="checkbox" name="suspended" checked={formData.suspended} onChange={handleChange} className="mt-1 size-4 rounded border-input text-destructive accent-destructive cursor-pointer" />
              <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground group-hover:text-destructive transition-colors duration-250 ease-luxe">Create as Suspended</span>
                <span className="text-sm text-muted-foreground">User will not be able to log in until suspension is lifted.</span>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-4 border rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Shield className="size-5 text-primary" />
            <h2 className="text-lg font-medium">Role Assignment*</h2>
          </div>

          <div>
            <Label className="mb-2 block">Active Roles</Label>
            <div className="flex flex-wrap gap-2 min-h-[44px] p-3 rounded-lg border border-border bg-muted items-center">
              {formData.roles.length === 0 && <span className="text-sm text-muted-foreground px-2">No roles selected</span>}
              {formData.roles.map((r) => (
                <span key={r} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                  <Shield className="size-3.5 opacity-70" />
                  {ROLE_LABELS[r] || r}
                  {formData.roles.length > 1 && (
                    <button type="button" onClick={() => removeRole(r)} className="ml-1 hover:text-destructive hover:bg-destructive/10 rounded-full p-0.5 transition-colors cursor-pointer duration-250 ease-luxe">&times;</button>
                  )}
                </span>
              ))}
            </div>
            {errors.roles && <p className="text-sm text-destructive mt-1">{errors.roles}</p>}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {ROLE_GROUPS.map((group) => {
              const selectedCount = formData.roles.filter(r => group.roles.includes(r)).length;
              const isSelected = selectedCategory === group.label;
              return (
                <button key={group.label} type="button" onClick={() => setSelectedCategory(group.label)}
                  className={`relative flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${isSelected ? 'bg-primary text-primary-foreground ' : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent hover:border-border'}`}>
                  {group.label}
                  {selectedCount > 0 && (
                    <span className={`inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-xs font-semibold ${isSelected ? 'bg-white/20 text-inherit' : 'bg-primary text-primary-foreground'}`}>{selectedCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border border-border rounded-lg p-4 bg-muted/10">
            {ROLE_GROUPS.filter(g => g.label === selectedCategory).map((group) => (
              <div key={group.label} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.roles.map((r) => {
                  const checked = formData.roles.includes(r)
                  return (
                    <label key={r} className={`flex items-start gap-3 p-3 rounded-lg text-sm cursor-pointer border transition-all ${checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      <input type="checkbox" checked={checked} onChange={(e) => handleRoleToggle(r, e.target.checked)} className="mt-0.5 size-4 rounded border-input text-primary accent-primary cursor-pointer" />
                      <span className={`font-medium ${checked ? 'text-primary' : 'text-foreground'}`}>{ROLE_LABELS[r]}</span>
                    </label>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {submitError && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <p className="text-sm font-medium">{submitError}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/admin/' as any })}>Cancel</Button>
          <Button type="submit" disabled={createAdmin.isPending || updateAdmin.isPending} className="min-w-[180px]">
            {(createAdmin.isPending || updateAdmin.isPending) ? (<><Loader2 className="size-4 animate-spin mr-2" />{isEdit ? 'Updating User...' : 'Creating User...'}</>) : (isEdit ? 'Update User Account' : 'Create User Account')}
          </Button>
        </div>
      </form>
    </div>
  )
}
