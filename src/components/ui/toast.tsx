import { useToastStore, type Toast, type ToastVariant } from '#/lib/hooks/useToast'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '#/lib/utils'

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle; className: string }> = {
  default: {
    icon: Info,
    className: 'bg-card border-border text-foreground',
  },
  success: {
    icon: CheckCircle,
    className: 'bg-success/10 border-success/30 text-success',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-destructive/10 border-destructive/30 text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-warning/10 border-warning/30 text-warning',
  },
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const config = variantConfig[toast.variant]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-slide-in-right',
        config.className,
      )}
      role="alert"
    >
      <Icon size={18} className="shrink-0" />
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 h-5 w-5 rounded-full hover:bg-black/10 flex items-center justify-center cursor-pointer transition-colors"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  )
}
