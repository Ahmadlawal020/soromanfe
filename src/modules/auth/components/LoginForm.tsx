import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '#/components/ui/dialog.tsx'
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg p-8 border border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 bg-slate-50 border border-slate-100 overflow-hidden">
              <img src="/logo.png" alt="logo" className="w-full h-full object-contain p-1" onError={(e) => {
                // Fallback to text logo if image fails to load
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-full h-full flex items-center justify-center bg-soroman-blue text-white font-bold text-2xl';
                  fallback.innerText = 'S';
                  parent.appendChild(fallback);
                }
              }} />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Soroman Energy</h1>
            <p className="text-muted-foreground mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {sessionExpired && (
              <div className="p-3 bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/50 rounded-lg text-sm font-medium text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-sm">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>Your session has expired. Please sign in again.</span>
              </div>
            )}
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/25 rounded-lg text-sm text-destructive" role="alert">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@soroman.com"
                  className="pl-10 h-auto rounded-xl py-3 text-base"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 h-auto rounded-xl py-3 text-base"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-soroman-blue focus:ring-soroman-blue"
                />
                <span className="text-sm font-medium text-foreground">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
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
              className="w-full h-auto rounded-xl py-3 text-base font-semibold gradient-primary text-white shadow-lg active:scale-95 transition-all cursor-pointer"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we&apos;ll send you a password setup link.
            </DialogDescription>
          </DialogHeader>

          {resetMutation.isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-success font-semibold">Password reset sent!</p>
              <p className="text-sm text-muted-foreground">
                If that email is registered, a link to configure a new password has been sent to it. Check your inbox.
              </p>
              <Button
                onClick={() => setForgotOpen(false)}
                className="mt-4 gradient-primary text-white rounded-xl px-6"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} noValidate className="space-y-4">
              {forgotError && (
                <div className="p-3 bg-destructive/10 border border-destructive/25 rounded-lg text-sm text-destructive" role="alert">
                  {forgotError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="admin@soroman.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="h-auto rounded-xl py-2 px-3 text-base"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="gradient-primary text-white rounded-xl"
                >
                  {resetMutation.isPending ? 'Sending...' : 'Send Setup Link'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
