import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Mail, Calendar, ShieldCheck, MapPin, Fuel, ChevronDown, BookOpen, Ban,
  UserCog, Loader2,
} from 'lucide-react'
import { PageHeader } from '#/components/PageHeader'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { MICRO } from '#/lib/panel'
import { useAuthStore } from '#/modules/auth'
import { useAdminDetails, useUpdateMyProfile, useChangeMyPassword } from '#/lib/hooks/useAdmin'
import { useCurrentUserRoles } from '#/lib/hooks/useRoles'
import { canAccessRoute, canPerformAction, isSuperAdmin } from '#/lib/rbac'
import { ROLE_LABELS } from '#/routes/admin/-roles'
import { navCategories } from '#/components/layout/nav-config'
import { PAGE_GUIDE } from './-page-guide'
import { routeGuard } from '#/lib/route-guard'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/profile/')({
  beforeLoad: () => routeGuard('/profile'),
  component: ProfilePage,
})

function getInitials(firstName?: string, surname?: string) {
  return `${firstName?.[0] || ''}${surname?.[0] || ''}`.toUpperCase() || '?'
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * The two things a person may change about their own account.
 *
 * Email is shown but not editable — it is the login identity and the address
 * a password reset goes to, so only a super admin reassigns one. The server
 * enforces that independently; this just doesn't offer the field.
 */
function AccountSettings({
  firstName, surname, phoneNumber, email,
}: {
  firstName: string
  surname: string
  phoneNumber: string
  email: string
}) {
  const updateProfile = useUpdateMyProfile()
  const changePassword = useChangeMyPassword()

  const [details, setDetails] = useState({ first_name: firstName, surname, phone_number: phoneNumber })
  const [seeded, setSeeded] = useState(`${firstName}|${surname}|${phoneNumber}`)
  const key = `${firstName}|${surname}|${phoneNumber}`
  if (seeded !== key) {
    setSeeded(key)
    setDetails({ first_name: firstName, surname, phone_number: phoneNumber })
  }

  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' })

  const detailsChanged =
    details.first_name !== firstName || details.surname !== surname || details.phone_number !== phoneNumber
  const detailsValid = details.first_name.trim().length > 0 && details.surname.trim().length > 0

  const pwMismatch = pw.confirm.length > 0 && pw.new_password !== pw.confirm
  const pwValid =
    pw.current_password.length > 0 && pw.new_password.length >= 8 && pw.new_password === pw.confirm

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCog className="size-4 text-primary" /> Account settings
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <p className={cn(MICRO, 'text-muted-foreground')}>Your details</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pf-first" className="text-xs text-muted-foreground">First name</Label>
              <Input
                id="pf-first" value={details.first_name}
                onChange={(e) => setDetails((d) => ({ ...d, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-surname" className="text-xs text-muted-foreground">Surname</Label>
              <Input
                id="pf-surname" value={details.surname}
                onChange={(e) => setDetails((d) => ({ ...d, surname: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-phone" className="text-xs text-muted-foreground">Phone number</Label>
              <Input
                id="pf-phone" value={details.phone_number}
                onChange={(e) => setDetails((d) => ({ ...d, phone_number: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-email" className="text-xs text-muted-foreground">Email</Label>
              <Input id="pf-email" value={email} readOnly disabled className="bg-muted/40" />
              <p className="text-xs leading-tight text-muted-foreground/70">
                Only a super admin can change this.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            disabled={!detailsChanged || !detailsValid || updateProfile.isPending}
            onClick={() => updateProfile.mutate({
              first_name: details.first_name.trim(),
              surname: details.surname.trim(),
              phone_number: details.phone_number.trim(),
            })}
          >
            {updateProfile.isPending && <Loader2 className="animate-spin" />}
            Save details
          </Button>
        </div>

        <div className="space-y-3 lg:border-l lg:border-foreground/10 lg:pl-6">
          <p className={cn(MICRO, 'text-muted-foreground')}>Change password</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-cur" className="text-xs text-muted-foreground">Current password</Label>
              <Input
                id="pf-cur" type="password" autoComplete="current-password" value={pw.current_password}
                onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-new" className="text-xs text-muted-foreground">New password</Label>
              <Input
                id="pf-new" type="password" autoComplete="new-password" value={pw.new_password}
                onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))}
              />
              {pw.new_password.length > 0 && pw.new_password.length < 8 && (
                <p className="text-xs text-warning">At least 8 characters.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-confirm" className="text-xs text-muted-foreground">Confirm new password</Label>
              <Input
                id="pf-confirm" type="password" autoComplete="new-password" value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              />
              {pwMismatch && <p className="text-xs text-destructive">The two passwords don't match.</p>}
            </div>
          </div>
          <p className="text-xs leading-tight text-muted-foreground/70">
            Changing your password signs you out everywhere, including here.
          </p>
          <Button
            size="sm" variant="outline"
            disabled={!pwValid || changePassword.isPending}
            onClick={() => changePassword.mutate({
              current_password: pw.current_password,
              new_password: pw.new_password,
            })}
          >
            {changePassword.isPending && <Loader2 className="animate-spin" />}
            Change password
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProfilePage() {
  const authUser = useAuthStore((s) => s.user)
  const { data: staff, isLoading, isError, error, refetch } = useAdminDetails(authUser?.id || '')
  const userRoles = useCurrentUserRoles()
  const superAdmin = isSuperAdmin(userRoles)

  const overrideMap = (authUser?.pageOverrides || []).reduce<Record<string, boolean>>((m, o) => {
    m[o.routePath] = o.allowed
    return m
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Who you're signed in as, what you're assigned to, and what you can do here."
      />

      {isLoading ? (
        <PageLoader message="Loading your profile…" />
      ) : isError ? (
        <PageError message={(error as any)?.message || 'Failed to load your profile'} onRetry={() => refetch()} />
      ) : (
        <>
          {/* Identity */}
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Avatar className="size-16">
                  <AvatarFallback className="text-lg font-semibold">
                    {getInitials(authUser?.firstName, authUser?.surname)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">
                      {authUser?.firstName} {authUser?.surname}
                    </h2>
                    {superAdmin && (
                      <Badge className="bg-primary/15 text-primary border-primary/30 gap-1 font-normal">
                        <ShieldCheck className="size-3" /> Super Admin
                      </Badge>
                    )}
                    {staff?.suspended && (
                      <Badge variant="destructive" className="gap-1 font-normal">
                        <Ban className="size-3" /> Suspended
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Mail className="size-3.5" /> {authUser?.email}</span>
                    <span className="flex items-center gap-1.5"><Calendar className="size-3.5" /> Member since {formatDate(staff?.date_joined)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {userRoles.length === 0 && <span className="text-xs text-muted-foreground">No role assigned</span>}
                    {userRoles.map((r) => (
                      <Badge key={r} variant="outline" className="text-xs">{ROLE_LABELS[r] || `Role ${r}`}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <AccountSettings
            firstName={authUser?.firstName || ''}
            surname={authUser?.surname || ''}
            phoneNumber={staff?.phone_number || ''}
            email={authUser?.email || ''}
          />

          {/* Where assigned */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="size-4 text-primary" /> Where you're assigned
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Locations</p>
                {staff?.can_view_all_locations ? (
                  <Badge className="mt-1.5 bg-accent/15 text-accent border-accent/30 font-normal">All locations</Badge>
                ) : staff?.location_names?.length ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {staff.location_names.map((n) => <Badge key={n} variant="outline" className="text-xs">{n}</Badge>)}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No locations assigned</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground flex items-center gap-1"><Fuel className="size-3" /> PFIs</p>
                {staff?.can_view_all_locations ? (
                  <Badge className="mt-1.5 bg-accent/15 text-accent border-accent/30 font-normal">All PFIs</Badge>
                ) : staff?.pfi_numbers?.length ? (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {staff.pfi_numbers.map((n) => <Badge key={n} variant="outline" className="text-xs">{n}</Badge>)}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">No PFIs assigned</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* What you can do + guide */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="size-4 text-primary" /> What you can do, page by page
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Every page in the sidebar, grouped the same way — what it's for, and whether you can open it.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {navCategories.filter((c) => c.items.length > 0).map((cat) => (
                <details key={cat.category || 'top'} className="group rounded-lg border border-border/60" open={false}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold text-foreground outline-none">
                    <span>{cat.category || 'General'}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-normal text-muted-foreground">
                        {cat.items.filter((i) => superAdmin || canAccessRoute(userRoles, i.path, overrideMap)).length} of {cat.items.length} pages
                      </span>
                      <ChevronDown className="size-4 text-muted-foreground transition-transform duration-250 ease-luxe group-open:rotate-180" />
                    </span>
                  </summary>
                  <div className="divide-y divide-border/60 border-t border-border/60">
                    {cat.items.map((item) => {
                      const accessible = superAdmin || canAccessRoute(userRoles, item.path, overrideMap)
                      const canCreate = accessible && (superAdmin || canPerformAction(userRoles, item.path, 'create'))
                      const canEdit = accessible && (superAdmin || canPerformAction(userRoles, item.path, 'edit'))
                      const canDelete = accessible && (superAdmin || canPerformAction(userRoles, item.path, 'delete'))
                      const Icon = item.icon
                      return (
                        <div key={item.path} className={cn('flex items-start gap-3 px-4 py-3', !accessible && 'opacity-50')}>
                          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-normal text-foreground">{item.title}</span>
                              {accessible ? (
                                <>
                                  {canCreate && <Badge variant="outline" className="text-xs">Create</Badge>}
                                  {canEdit && <Badge variant="outline" className="text-xs">Edit</Badge>}
                                  {canDelete && <Badge variant="outline" className="text-xs text-destructive">Delete</Badge>}
                                </>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">Not accessible to you</Badge>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {PAGE_GUIDE[item.path] || 'No description yet for this page.'}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </details>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
