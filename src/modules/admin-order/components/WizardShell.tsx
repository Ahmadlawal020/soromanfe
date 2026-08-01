import { ArrowLeft, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { PANEL } from '#/lib/panel'
import { cn } from '#/lib/utils'

/**
 * The wizard surface: a titled header rail, the step body, and a footer that
 * holds Back and the forward action.
 *
 * A disabled forward button always explains itself via `hint` — the system
 * never leaves a dead control unexplained.
 */
export function WizardShell({
  title,
  description,
  error,
  children,
  onBack,
  backDisabled,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
  nextPending,
  hint,
  footer = true,
}: {
  title: string
  description?: string
  error?: string | null
  children: React.ReactNode
  onBack?: () => void
  backDisabled?: boolean
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  nextPending?: boolean
  hint?: string
  footer?: boolean
}) {
  return (
    <section className={cn(PANEL, 'mx-auto w-full max-w-3xl')}>
      <div className="border-b border-foreground/15 px-6 py-5">
        <h2 className="text-base font-medium tracking-tight">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 border-b border-destructive/25 bg-destructive/10 px-6 py-3 text-sm font-medium text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="px-6 py-6">{children}</div>

      {footer && (
        <div className="flex items-center justify-between gap-3 bg-muted/40 px-6 py-4">
          {onBack ? (
            <Button variant="outline" onClick={onBack} disabled={backDisabled}>
              <ArrowLeft data-icon="inline-start" />
              Back
            </Button>
          ) : (
            <span />
          )}

          {onNext && (
            <div className="flex flex-col items-end gap-1">
              <Button onClick={onNext} disabled={nextDisabled || nextPending}>
                {nextPending && <Loader2 className="animate-spin" />}
                {nextPending ? 'Processing…' : nextLabel}
                {!nextPending && <ArrowRight data-icon="inline-end" />}
              </Button>
              {nextDisabled && hint && (
                <p className="text-right text-[0.65rem] text-muted-foreground/70">{hint}</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
