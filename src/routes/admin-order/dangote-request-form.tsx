import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  User,
  ShieldPlus,
  Package,
  CircleDollarSign,
  MapPin,
  FileCheck,
} from 'lucide-react'
import { useDangoteOrderWizard } from '#/modules/admin-order/hooks/useDangoteOrderWizard'
import {
  DangoteCustomerStep,
  DangoteCompanyLicenseStep,
  DangoteProductStep,
  DangoteQuantityStep,
  DangoteDeliveryStep,
  DangoteReviewStep,
  DangoteCompletionStep,
} from '#/modules/admin-order/components/DangoteSteps'

export const Route = createFileRoute('/admin-order/dangote-request-form')({
  component: DangoteRequestForm,
})

const DANGOTE_WIZARD_STEPS = [
  { title: 'Customer', shortTitle: 'Customer', icon: User },
  { title: 'Company', shortTitle: 'Company', icon: ShieldPlus },
  { title: 'Product', shortTitle: 'Product', icon: Package },
  { title: 'Quantity', shortTitle: 'Quantity', icon: CircleDollarSign },
  { title: 'Delivery', shortTitle: 'Delivery', icon: MapPin },
  { title: 'Review', shortTitle: 'Review', icon: FileCheck },
]

function DangoteProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between max-w-2xl mx-auto">
      {DANGOTE_WIZARD_STEPS.map((s, i) => {
        const stepNum = i + 1
        const isActive = step === stepNum
        const isCompleted = step > stepNum
        const Icon = s.icon

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : isCompleted
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-muted text-muted-foreground border border-border'
                  }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider hidden sm:block ${isActive ? 'text-primary' : isCompleted ? 'text-primary/70' : 'text-muted-foreground'
                }`}>
                {s.shortTitle}
              </span>
            </div>
            {i < DANGOTE_WIZARD_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${isCompleted ? 'bg-primary/40' : 'bg-border'
                }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function DangoteRequestForm() {
  const navigate = useNavigate()
  const wizard = useDangoteOrderWizard()

  const { step, error, handlePrevStep, handleNextStep, handlePlaceOrder, createDangoteOrderRequestMutation } = wizard

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: '/admin-order' as any })}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Place Dangote Delivery Order</h1>
          <p className="text-muted-foreground">Submit a Dangote delivery order request for review and approval.</p>
        </div>
      </div>

      {/* Progress Indicator */}
      {step <= 6 && <DangoteProgressBar step={step} />}

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2 border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Wizard Card */}
      <Card className="shadow-md">
        <CardContent className="pt-6">
          {step === 1 && <DangoteCustomerStep wizard={wizard} />}
          {step === 2 && <DangoteCompanyLicenseStep wizard={wizard} />}
          {step === 3 && <DangoteProductStep wizard={wizard} />}
          {step === 4 && <DangoteQuantityStep wizard={wizard} />}
          {step === 5 && <DangoteDeliveryStep wizard={wizard} />}
          {step === 6 && <DangoteReviewStep wizard={wizard} />}
          {step === 7 && <DangoteCompletionStep wizard={wizard} />}
        </CardContent>

        {/* Footer Navigation */}
        {step <= 6 && (
          <CardFooter className="border-t border-border flex justify-between pt-4 bg-muted/20">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            {step === 6 ? (
              <Button
                className="bg-primary hover:bg-primary/90 text-white border-0 min-w-[140px]"
                onClick={handlePlaceOrder}
                disabled={createDangoteOrderRequestMutation.isPending}
              >
                {createDangoteOrderRequestMutation.isPending ? (
                  <><Loader2 size={16} className="animate-spin mr-2" />Submitting...</>
                ) : (
                  'Place Order'
                )}
              </Button>
            ) : (
              <Button
                className="bg-primary hover:bg-primary/90 text-white border-0 min-w-[100px]"
                onClick={handleNextStep}
              >
                Next <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
