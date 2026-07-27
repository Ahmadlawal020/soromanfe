import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Mail, Lock, Eye, EyeOff, X } from 'lucide-react'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { useAdminLogin, useRequestPasswordReset } from '../hooks/hook'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotError, setForgotError] = useState('')

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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-100">
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
            <h1 className="text-2xl font-bold text-slate-800">Soroman Energy</h1>
            <p className="text-slate-500 mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/25 rounded-lg text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@soroman.com"
                  className="pl-10 h-auto rounded-xl py-3 text-base text-slate-900 bg-white border-slate-200 placeholder:text-slate-400"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 h-auto rounded-xl py-3 text-base text-slate-900 bg-white border-slate-200 placeholder:text-slate-400"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
                <span className="text-sm font-medium text-slate-700">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-sm font-medium text-soroman-blue hover:text-soroman-orange transition-colors cursor-pointer"
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
              className="w-full h-auto rounded-xl py-3 text-base font-semibold bg-soroman-blue hover:bg-soroman-blue/90 text-white shadow-lg active:scale-95 transition-all cursor-pointer"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>

      {/* Custom dialog modal for Forgot Password */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Reset Password</h2>
              <button
                onClick={() => setForgotOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {resetMutation.isSuccess ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-green-700 font-semibold">Password reset sent!</p>
                  <p className="text-sm text-slate-500">
                    If that email is registered, a link to configure a new password has been sent to it. Check your inbox.
                  </p>
                  <Button
                    onClick={() => setForgotOpen(false)}
                    className="mt-4 bg-soroman-blue hover:bg-soroman-blue/90 text-white rounded-xl px-6"
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Enter your email address and we'll send you a password setup link.
                  </p>
                  {forgotError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/25 rounded-lg text-sm text-destructive">
                      {forgotError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-slate-700">Email Address</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="admin@soroman.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="h-auto rounded-xl py-2 px-3 text-base text-slate-900 bg-white border-slate-200 placeholder:text-slate-400"
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
                      className="bg-soroman-blue hover:bg-soroman-blue/90 text-white rounded-xl"
                    >
                      {resetMutation.isPending ? 'Sending...' : 'Send Setup Link'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
