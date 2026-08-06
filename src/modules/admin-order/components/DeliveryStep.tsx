import { Truck, Warehouse } from 'lucide-react'
import { ChoiceCard, ChoiceGrid } from '#/components/ui/choice-card'
import type { OrderWizardReturn } from '../hooks/useOrderWizard'

interface DeliveryStepProps {
  wizard: OrderWizardReturn
}

const OPTIONS = [
  {
    value: 'pickup' as const,
    icon: <Warehouse />,
    title: 'Self pickup',
    subtitle: 'The customer sends their own trucks to load at the depot.',
  },
  {
    value: 'delivery' as const,
    icon: <Truck />,
    title: 'Company delivery',
    subtitle: 'Soroman moves it. Trucks are allocated when the order is released.',
  },
]

export function DeliveryStep({ wizard }: DeliveryStepProps) {
  const { deliveryType, setDeliveryType } = wizard

  return (
    <ChoiceGrid>
      {OPTIONS.map((o) => (
        <ChoiceCard
          key={o.value}
          selected={deliveryType === o.value}
          onSelect={() => setDeliveryType(o.value)}
          icon={o.icon}
          title={o.title}
          subtitle={o.subtitle}
        />
      ))}
    </ChoiceGrid>
  )
}
