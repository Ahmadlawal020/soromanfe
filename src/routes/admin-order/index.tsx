import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, CardContent } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import {
  ArrowLeft,
  Truck,
  Building2,
} from 'lucide-react'

export const Route = createFileRoute('/admin-order/')({
  component: CreateOrderWizard,
})

function OrderTypeSelection() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: '/orders' as any })}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Place Customer Order</h1>
          <p className="text-muted-foreground">Select the type of order you want to place.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 max-w-2xl mx-auto pt-4">
        <Card
          className="cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-lg hover:scale-[1.02] group"
          onClick={() => navigate({ to: '/admin-order/depot' as any })}
        >
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Truck size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Depot Order</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Place an order from Soroman depots. Select customer, depot, product, and delivery options.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-lg hover:scale-[1.02] group"
          onClick={() => navigate({ to: '/admin-order/dangote-request-form' })}
        >
          <CardContent className="pt-8 pb-6 flex flex-col items-center text-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <Building2 size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Dangote Delivery Order</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Place a Dangote delivery order request. Select customer, product, quantity, and delivery location.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CreateOrderWizard() {
  return <OrderTypeSelection />
}
