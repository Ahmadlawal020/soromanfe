import { Check } from 'lucide-react'

import { cn } from '#/lib/utils'
import { WIZARD_STEPS } from '../utils/constants'

export type WizardStep = {
  title: string
  shortTitle: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * The icon stepper — circles on a connector, capped at max-w-3xl.
 *
 * Completed steps are clickable so you can go back and correct something;
 * future steps are inert, since skipping ahead would leave gaps behind you.
 */
export function WizardStepper({
  steps,
  step,
  onStepClick,
}: {
  steps: WizardStep[]
  /** 1-based. */
  step: number
  onStepClick?: (step: number) => void
}) {
  const pct = steps.length > 1 ? (step - 1) / (steps.length - 1) : 0

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      {/* Connector track and fill, inset so they meet the dot centres. */}
      <div className="absolute top-5 right-[10%] left-[10%] h-0.5 bg-border" />
      <div
        className="absolute top-5 left-[10%] h-0.5 bg-primary transition-[width] duration-300 ease-luxe"
        style={{ width: `${pct * 80}%` }}
      />

      <ol className="relative flex items-start justify-between">
        {steps.map((s, i) => {
          const n = i + 1
          const done = step > n
          const active = step === n
          const Icon = s.icon
          const clickable = done && Boolean(onStepClick)

          return (
            <li key={s.title} className="flex flex-1 flex-col items-center gap-2">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(n)}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'relative z-10 flex size-10 items-center justify-center rounded-full sm:size-11',
                  'transition-colors duration-250 ease-luxe outline-none',
                  'focus-visible:ring-3 focus-visible:ring-ring/50',
                  clickable ? 'cursor-pointer' : 'cursor-default',
                  active && 'bg-primary text-primary-foreground ring-4 ring-primary/15',
                  done && 'bg-primary text-primary-foreground',
                  !active && !done && 'bg-muted text-muted-foreground',
                )}
              >
                {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                <span className="sr-only">
                  {`Step ${n} of ${steps.length}: ${s.title}`}
                </span>
              </button>

              <span
                className={cn(
                  'max-w-16 text-center text-[0.65rem] leading-tight font-normal sm:max-w-20 sm:text-xs',
                  active && 'text-primary underline decoration-2 underline-offset-4',
                  done && 'text-muted-foreground',
                  !active && !done && 'text-muted-foreground/50',
                )}
              >
                <span className="hidden sm:inline">{s.title}</span>
                <span className="sm:hidden">{s.shortTitle}</span>
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Back-compat wrapper for the depot flow's fixed step list. */
export function WizardProgressBar({
  step,
  onStepClick,
}: {
  step: number
  onStepClick?: (step: number) => void
}) {
  return <WizardStepper steps={WIZARD_STEPS} step={step} onStepClick={onStepClick} />
}
