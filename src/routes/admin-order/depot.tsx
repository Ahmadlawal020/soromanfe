import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { useOrderWizard } from '#/modules/admin-order/hooks/useOrderWizard'
import {
  WizardProgressBar,
  CustomerStep,
  LocationDepotStep,
  ProductStep,
  DeliveryStep,
  ReviewStep,
  CompletionStep,
} from '#/modules/admin-order/components'

export const Route = createFileRoute('/admin-order/depot')({
  component: DepotOrderWizard,
})

function DepotOrderWizard() {
  const navigate = useNavigate()
  const wizard = useOrderWizard()

  const { step, error, handlePrevStep, handleNextStep, handlePlaceOrder, createOrderMutation } = wizard

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
          <h1 className="text-3xl font-bold tracking-tight">Place Depot Order</h1>
          <p className="text-muted-foreground">Follow the step-by-step process to verify customers, select inventory, and place orders.</p>
        </div>
      </div>

      {/* Progress Indicator */}
      {step <= 5 && <WizardProgressBar step={step} />}

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
          {step === 1 && <CustomerStep wizard={wizard} />}
          {step === 2 && <LocationDepotStep wizard={wizard} />}
          {step === 3 && <ProductStep wizard={wizard} />}
          {step === 4 && <DeliveryStep wizard={wizard} />}
          {step === 5 && <ReviewStep wizard={wizard} />}
          {step === 6 && <CompletionStep wizard={wizard} />}
        </CardContent>

        {/* Footer Navigation */}
        {step <= 5 && (
          <CardFooter className="border-t border-border flex justify-between pt-4 bg-muted/20">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            {step === 5 ? (
              <Button
                className="gradient-primary text-white border-0 min-w-[140px]"
                onClick={handlePlaceOrder}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <><Loader2 size={16} className="animate-spin mr-2" />Processing...</>
                ) : (
                  'Place Order'
                )}
              </Button>
            ) : (
              <Button
                className="gradient-primary text-white border-0 min-w-[100px]"
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
