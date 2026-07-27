import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { useSetPassword } from '#/modules/admin/hooks/hook'

export const Route = createFileRoute('/set-password')({
  validateSearch: (search: Record<string, unknown>) => ({ token: (search.token as string) || '' }),
  component: SetPassword,
})

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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 bg-slate-50 border border-slate-100 overflow-hidden">
            <img src="/logo.png" alt="logo" className="w-full h-full object-contain p-1" onError={(e) => {
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
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20 mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Invalid Link</h2>
          <p className="text-sm text-slate-500 mb-6">This password setup link is invalid or missing a token.</p>
          <Button onClick={() => navigate({ to: '/login' })} className="w-full bg-soroman-blue hover:bg-soroman-blue/90 text-white rounded-xl py-3 h-auto text-base font-semibold">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 bg-slate-50 border border-slate-100 overflow-hidden">
            <img src="/logo.png" alt="logo" className="w-full h-full object-contain p-1" onError={(e) => {
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
          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20 mx-auto mb-4">
            <CheckCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Password Set Successfully!</h2>
          <p className="text-sm text-slate-500 mb-6">Your password has been configured. You can now log in.</p>
          <Button onClick={() => navigate({ to: '/login' })} className="w-full bg-soroman-blue hover:bg-soroman-blue/90 text-white rounded-xl py-3 h-auto text-base font-semibold">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 bg-slate-50 border border-slate-100 overflow-hidden">
            <img src="/logo.png" alt="logo" className="w-full h-full object-contain p-1" onError={(e) => {
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
          <p className="text-slate-500 mt-2">Set Your Password</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (errors.password) setErrors((p) => { const n = { ...p }; delete n.password; return n })
                }}
                placeholder="Minimum 8 characters"
                className={`pl-10 h-auto rounded-xl py-3 text-base ${errors.password ? 'border-destructive' : ''}`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer animate-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (errors.confirmPassword) setErrors((p) => { const n = { ...p }; delete n.confirmPassword; return n })
                }}
                placeholder="Re-enter your password"
                className={`pl-10 h-auto rounded-xl py-3 text-base ${errors.confirmPassword ? 'border-destructive' : ''}`}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer animate-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
          </div>

          {submitError && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-sm font-medium">{submitError}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={setPasswordMutation.isPending}
            className="w-full h-auto rounded-xl py-3 text-base font-semibold bg-soroman-blue hover:bg-soroman-blue/90 text-white shadow-lg active:scale-95 transition-all cursor-pointer border-0"
          >
            {setPasswordMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Setting Password...
              </>
            ) : (
              'Set Password'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
