import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Mail, Lock, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '#/components/ui/button.tsx'
import { BoxedInput } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Checkbox } from '#/components/ui/checkbox.tsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '#/components/ui/dialog.tsx'
import { MICRO } from '#/lib/panel'
import { useAdminLogin, useRequestPasswordReset } from '../hooks/hook'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')

  useEffect(() => {
    try {
      if (sessionStorage.getItem('soroman-session-expired') === '1') {
        setSessionExpired(true)
        sessionStorage.removeItem('soroman-session-expired')
      }
    } catch {}
  }, [])

  const loginMutation = useAdminLogin()
  const resetMutation = useRequestPasswordReset()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    if (!password) {
      setError('Please enter your password')
      return
    }

    try {
      await loginMutation.mutateAsync({ email, password })
      navigate({ to: '/overview' })
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Failed to login. Please check your credentials.',
      )
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotError('')
    try {
      await resetMutation.mutateAsync(forgotEmail.trim())
    } catch (err: any) {
      setForgotError(
        err.response?.data?.message ||
        'Something went wrong. Please try again.',
      )
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-14 sm:py-20">
      <div className="w-full max-w-md">
        {/* The square mark sits above the panel, not inside it. */}
        <img src="/logo.png" alt="Soroman" className="mx-auto mb-6 size-11" />

        {/* The auth panel is the PANEL recipe at a wider padding. */}
        <div className="rounded-xl border border-foreground/15 bg-background p-7 sm:p-10">
          <div className="mb-8 text-center">
            <p className={`${MICRO} mb-2 text-muted-foreground`}>Soroman Energy</p>
            <h1 className="text-xl font-semibold tracking-tight text-balance">
              Sign in to your account
            </h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {sessionExpired && (
              <div className="flex items-start gap-2.5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>Your session has expired. Please sign in again.</span>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <BoxedInput
                  id="email"
                  type="email"
                  placeholder="admin@soroman.com"
                  className="pl-10"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <BoxedInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pr-10 pl-10"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="remember" className="cursor-pointer">
                <Checkbox id="remember" />
                Remember me
              </Label>
              <button
                type="button"
                className="cursor-pointer text-sm font-normal text-accent underline-offset-4 transition-colors duration-250 ease-luxe outline-none hover:underline focus-visible:underline"
                onClick={() => {
                  setForgotOpen(true)
                  resetMutation.reset()
                  setForgotEmail('')
                  setForgotError('')
                }}
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending && <Loader2 className="animate-spin" />}
              {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Enter your email address and we&apos;ll send you a password setup link.
            </DialogDescription>
          </DialogHeader>

          {resetMutation.isSuccess ? (
            <div className="space-y-3 py-4 text-center">
              <p className="font-normal text-accent">Password reset sent</p>
              <p className="text-sm text-muted-foreground">
                If that email is registered, a link to configure a new password has been sent to it. Check your inbox.
              </p>
              <Button onClick={() => setForgotOpen(false)} className="mt-4">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} noValidate className="space-y-4">
              {forgotError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
                  {forgotError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email address</Label>
                <BoxedInput
                  id="forgot-email"
                  type="email"
                  placeholder="admin@soroman.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={resetMutation.isPending}>
                  {resetMutation.isPending && <Loader2 className="animate-spin" />}
                  {resetMutation.isPending ? 'Sending…' : 'Send setup link'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
