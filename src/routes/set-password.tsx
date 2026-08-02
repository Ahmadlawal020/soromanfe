import { useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { BoxedInput } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { MICRO } from '#/lib/panel'
import { useSetPassword } from '#/modules/admin/hooks/hook'

export const Route = createFileRoute('/set-password')({
  validateSearch: (search: Record<string, unknown>) => ({ token: (search.token as string) || '' }),
  component: SetPassword,
})

/**
 * The auth panel recipe: the square mark above, then PANEL at a wider padding.
 * Everything is token-driven so this surface follows the theme — it used to be
 * hardcoded to a light palette.
 */
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-14 sm:py-20">
      <div className="w-full max-w-md">
        <img src="/logo.png" alt="Soroman" className="mx-auto mb-6 size-11" />
        <div className="rounded-xl border border-foreground/15 bg-background p-7 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  )
}

function SetPassword() {
  const navigate = useNavigate()
  const { token } = Route.useSearch()
  const setPasswordMutation = useSetPassword()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!token) { newErrors.token = 'Invalid or missing reset token.'; return newErrors }
    if (!newPassword) newErrors.password = 'Password is required'
    else if (newPassword.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    try { await setPasswordMutation.mutateAsync({ token, password: newPassword }); setSubmitted(true) }
    catch (err: any) { setSubmitError(err?.response?.data?.message || 'Failed to set password.') }
  }

  if (!token) {
    return (
      <AuthShell>
        <PageHeader
      eyebrow="Soroman"
      title="Invalid link"
      actions={
        <>
          <h1 className="text-xl font-semibold tracking-tight">Invalid link</h1>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">
          This password setup link is invalid or missing a token.
          </p>
          <Button size="lg" className="w-full" onClick={() => navigate({ to: '/login' })}>
          Go to login
          </Button>
        </>
      }
    />
      </AuthShell>
    )
  }

  if (submitted) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <CheckCircle className="size-4" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Password set</h1>
          <p className="mt-2 mb-6 text-sm text-muted-foreground">
            Your password has been configured. You can sign in now.
          </p>
          <Button size="lg" className="w-full" onClick={() => navigate({ to: '/login' })}>
            Go to login
          </Button>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="mb-8 text-center">
        <p className={`${MICRO} mb-2 text-muted-foreground`}>Soroman Energy</p>
        <h1 className="text-xl font-semibold tracking-tight text-balance">
          Set your password
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <BoxedInput
              id="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (errors.password) setErrors((p) => { const n = { ...p }; delete n.password; return n })
              }}
              placeholder="Minimum 8 characters"
              aria-invalid={errors.password ? true : undefined}
              className="pr-10 pl-10"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors duration-250 ease-luxe outline-none hover:text-foreground focus-visible:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              <span className="sr-only">
                {showPassword ? 'Hide password' : 'Show password'}
              </span>
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-destructive" role="alert">{errors.password}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <BoxedInput
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword) setErrors((p) => { const n = { ...p }; delete n.confirmPassword; return n })
              }}
              placeholder="Re-enter your password"
              aria-invalid={errors.confirmPassword ? true : undefined}
              className="pr-10 pl-10"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3.5 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors duration-250 ease-luxe outline-none hover:text-foreground focus-visible:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              <span className="sr-only">
                {showPassword ? 'Hide password' : 'Show password'}
              </span>
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive" role="alert">{errors.confirmPassword}</p>
          )}
        </div>

        {submitError && (
          <div
            className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive"
            role="alert"
          >
            <AlertCircle className="size-4 shrink-0" />
            <p className="text-sm font-normal">{submitError}</p>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={setPasswordMutation.isPending}>
          {setPasswordMutation.isPending && <Loader2 className="animate-spin" />}
          {setPasswordMutation.isPending ? 'Setting password…' : 'Set password'}
        </Button>
      </form>
    </AuthShell>
  )
}
