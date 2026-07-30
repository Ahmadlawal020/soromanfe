import { CheckCircle } from 'lucide-react'
import { WIZARD_STEPS } from '../utils/constants'

interface WizardProgressBarProps {
  step: number
}

export function WizardProgressBar({ step }: WizardProgressBarProps) {
  return (
    <div className="border rounded-xl bg-card p-3 sm:p-4 shadow-sm">
      <div className="flex justify-between items-center relative">
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-muted -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-4 h-0.5 -translate-y-1/2 z-0 transition-all duration-500 ease-out bg-gradient-to-r from-lime-700 to-lime-500"
          style={{ width: `${((step - 1) / (WIZARD_STEPS.length - 1)) * (100 - 8)}%` }}
        />
        {WIZARD_STEPS.map((stepInfo, idx) => {
          const StepIcon = stepInfo.icon
          const isCompleted = step > idx + 1
          const isActive = step === idx + 1

          return (
            <div key={idx} className="flex flex-col items-center z-10 relative">
              <div
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                  ? 'bg-gradient-to-tr from-lime-700 to-lime-500 border-lime-600 text-white'
                  : isActive
                    ? 'bg-card border-primary text-primary shadow-[0_0_0_4px_rgba(13,148,136,0.15)] ring-2 ring-primary ring-offset-2'
                    : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                  }`}
              >
                {isCompleted ? (
                  <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                ) : (
                  <StepIcon size={14} className="sm:w-4 sm:h-4" />
                )}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-semibold mt-1.5 transition-colors duration-200 ${isActive ? 'text-primary' : isCompleted ? 'text-lime-700' : 'text-muted-foreground'
                  }`}
              >
                <span className="hidden sm:inline">{stepInfo.title}</span>
                <span className="sm:hidden">{stepInfo.shortTitle}</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
