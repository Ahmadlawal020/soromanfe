import { useToastStore, type Toast, type ToastVariant } from '#/lib/hooks/useToast'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '#/lib/utils'

// Grounds sit on --popover so toasts lift off the page the way every other
// raised surface does; state is carried by a tinted wash and the border.
const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle; className: string }> = {
  default: {
    icon: Info,
    className: 'bg-popover border-foreground/15 text-popover-foreground',
  },
  success: {
    icon: CheckCircle,
    className: 'bg-popover border-success/40 text-success',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-popover border-destructive/40 text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-popover border-warning/40 text-warning',
  },
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast)
  const config = variantConfig[toast.variant]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'animate-slide-in-right flex items-center gap-3 rounded-lg border px-4 py-3 ',
        config.className,
      )}
      role="alert"
    >
      <Icon className="size-4 shrink-0" />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={() => removeToast(toast.id)}
        className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-60 transition-opacity duration-200 ease-luxe outline-none hover:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50"
        aria-label="Dismiss"
      >
        <X className="size-3" />
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
