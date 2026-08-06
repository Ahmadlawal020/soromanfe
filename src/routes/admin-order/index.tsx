import { useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Truck, Building2, Package, ClipboardCheck, User, Flame, CreditCard, Zap } from 'lucide-react'

import { SegmentedChoice } from '#/components/ui/segmented-choice'
import { MICRO } from '#/lib/panel'
import { cn } from '#/lib/utils'

import { useOrderWizard } from '#/modules/admin-order/hooks/useOrderWizard'
import { useDangoteOrderWizard } from '#/modules/admin-order/hooks/useDangoteOrderWizard'
import { useLpgOrderWizard } from '#/modules/admin-order/hooks/useLpgOrderWizard'
import { WizardStepper, type WizardStep } from '#/modules/admin-order/components/WizardProgressBar'
import { WizardShell } from '#/modules/admin-order/components/WizardShell'
import {
  CustomerStep, LocationDepotStep, ProductStep, DeliveryStep, ReviewStep, CompletionStep,
} from '#/modules/admin-order/components'
import {
  DangoteCustomerStep, DangoteCompanyLicenseStep, DangoteProductStep,
  DangoteQuantityStep, DangoteDeliveryStep, DangoteReviewStep, DangoteCompletionStep,
} from '#/modules/admin-order/components/DangoteSteps'
import {
  LpgCustomerStep, LpgStationStep, LpgCylinderStep,
  LpgDeliveryStep, LpgReviewStep, LpgCompletionStep,
} from '#/modules/admin-order/components/LpgSteps'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/admin-order/')({
  beforeLoad: () => routeGuard('/admin-order'),
  component: CreateOrderPage,
})

type OrderType = 'depot' | 'dangote' | 'lpg'

/**
 * A screen groups several of the hook's internal steps.
 *
 * The hooks still count 1..5 (depot) and 1..6 (Dangote) and validate one step
 * at a time; grouping is purely presentational, so a screen advances only once
 * every step it contains passes validation.
 */
type Group = {
  title: string
  description: string
  shortTitle: string
  icon: WizardStep['icon']
  steps: number[]
  /** Sub-heading above each step's fields; omitted when the group holds one. */
  sections?: string[]
}

const DEPOT_GROUPS: Group[] = [
  {
    title: 'Customer', shortTitle: 'Customer', icon: User,
    description: 'Find an existing customer or register a new one.',
    steps: [1],
  },
  {
    title: 'Order details', shortTitle: 'Details', icon: Package,
    description: 'Depot, product, quantity and how it leaves the yard.',
    steps: [2, 3, 4],
    sections: ['Location & depot', 'Product & quantity', 'Delivery'],
  },
  {
    title: 'Review', shortTitle: 'Review', icon: ClipboardCheck,
    description: 'Check everything before placing the order.',
    steps: [5],
  },
]

const DANGOTE_GROUPS: Group[] = [
  {
    title: 'Customer', shortTitle: 'Customer', icon: User,
    description: 'Who the request is for, and the licence it sits under.',
    steps: [1, 2],
    sections: ['Customer', 'Company & licence'],
  },
  {
    title: 'Order', shortTitle: 'Details', icon: Package,
    description: 'Select product, quantity, and where to deliver.',
    steps: [3, 4, 5],
    sections: ['Product', 'Quantity', 'Delivery'],
  },
  {
    title: 'Review', shortTitle: 'Review', icon: ClipboardCheck,
    description: 'Check everything before submitting the request.',
    steps: [6],
  },
]

const LPG_GROUPS: Group[] = [
  {
    title: 'Customer', shortTitle: 'Customer', icon: User,
    description: 'Find an existing customer or register a new one.',
    steps: [1],
  },
  {
    title: 'Order', shortTitle: 'Order', icon: Flame,
    description: 'Select an LPG station by location and choose your cylinders.',
    steps: [2, 3],
    sections: ['LPG Station', 'Cylinder selection'],
  },
  {
    title: 'Delivery', shortTitle: 'Delivery', icon: Truck,
    description: 'Enter the delivery address for the order.',
    steps: [4],
  },
  {
    title: 'Review', shortTitle: 'Review', icon: ClipboardCheck,
    description: 'Review everything before submitting the request.',
    steps: [5],
  },
]

/** One step's fields inside a grouped screen, with its own quiet heading. */
function Section({
  label,
  index,
  children,
}: {
  label?: string
  /** 1-based position, shown as a rail number when a screen holds several. */
  index?: number
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      {label && (
        <div className="flex items-center gap-2.5 border-b border-foreground/10 pb-2">
          {index != null && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
              {index}
            </span>
          )}
          <p className={cn(MICRO, 'text-muted-foreground')}>{label}</p>
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * How many of a screen's steps to show.
 *
 * A grouped screen used to render every section at once, so "Order details"
 * opened as a wall of depot, product, quantity and delivery with nothing
 * filled in. Instead each section appears once the one above it validates —
 * the same rule the Continue button already enforces, just applied earlier so
 * the form grows as it is answered.
 *
 * Purely presentational: nothing here changes what is submitted.
 */
function useRevealed(
  wizard: { validateStep: (n: number) => string | null },
  steps: number[],
) {
  let count = 1
  for (const s of steps) {
    if (wizard.validateStep(s)) break
    if (count < steps.length) count += 1
  }
  return steps.slice(0, count)
}

/** Shared group navigation — validates every step on screen before advancing. */
function useGroupNav(
  wizard: { step: number; setStep: (n: number) => void; setErrors: (m: string[]) => void; validateStep: (n: number) => string[] },
  groups: Group[],
) {
  const index = Math.max(groups.findIndex((g) => g.steps.includes(wizard.step)), 0)
  const group = groups[index]
  const isLast = index === groups.length - 1

  const next = () => {
    const allErrors: string[] = []
    for (const s of group.steps) {
      const stepErrors = wizard.validateStep(s)
      allErrors.push(...stepErrors)
    }
    if (allErrors.length > 0) {
      wizard.setErrors(allErrors)
      return false
    }
    wizard.setErrors([])
    const following = groups[index + 1]
    if (following) wizard.setStep(following.steps[0])
    return true
  }

  const back = () => {
    const previous = groups[index - 1]
    if (!previous) return
    wizard.setErrors([])
    wizard.setStep(previous.steps[0])
  }

  /** Jumping via the stepper is only allowed backwards. */
  const goTo = (groupNumber: number) => {
    if (groupNumber - 1 >= index) return
    wizard.setErrors([])
    wizard.setStep(groups[groupNumber - 1].steps[0])
  }

  return { index, group, isLast, next, back, goTo }
}

function DepotFlow() {
  const wizard = useOrderWizard()
  const { step, errors, handlePlaceOrder, createOrderMutation } = wizard
  const nav = useGroupNav(wizard, DEPOT_GROUPS)
  const revealed = useRevealed(wizard, nav.group.steps)
  const done = step > 5

  if (done) {
    return (
      <WizardShell title="Order placed" description="The order is in the register." footer={false}>
        <CompletionStep wizard={wizard} />
      </WizardShell>
    )
  }

  return (
    <div className="space-y-8">
      <WizardStepper
        steps={DEPOT_GROUPS.map((g) => ({ title: g.title, shortTitle: g.shortTitle, icon: g.icon }))}
        step={nav.index + 1}
        onStepClick={nav.goTo}
      />

      <WizardShell
        title={nav.group.title}
        description={nav.group.description}
        errors={errors}
        onBack={nav.back}
        backDisabled={nav.index === 0}
        onNext={nav.isLast ? handlePlaceOrder : nav.next}
        nextLabel={nav.isLast ? 'Place order' : 'Continue'}
        nextPending={createOrderMutation.isPending}
      >
        <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3 mb-6">
          <Zap className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">DVA Auto-Subaccount Settlement:</span> Upon placing this depot order, the customer&apos;s Dedicated Virtual Account (DVA) is automatically switched to the selected depot&apos;s Paystack Subaccount so all payments land directly in the depot&apos;s account.
          </div>
        </div>

        <div className="space-y-8">
          {revealed.map((s) => {
            const i = nav.group.steps.indexOf(s)
            return (
            <Section
              key={s}
              label={nav.group.sections?.[i]}
              index={nav.group.sections ? i + 1 : undefined}
            >
              {s === 1 && <CustomerStep wizard={wizard} />}
              {s === 2 && <LocationDepotStep wizard={wizard} />}
              {s === 3 && <ProductStep wizard={wizard} />}
              {s === 4 && <DeliveryStep wizard={wizard} />}
              {s === 5 && <ReviewStep wizard={wizard} />}
            </Section>
            )
          })}
        </div>
      </WizardShell>
    </div>
  )
}

function DangoteFlow() {
  const wizard = useDangoteOrderWizard()
  const { step, errors, handlePlaceOrder, createDangoteOrderRequestMutation } = wizard
  const nav = useGroupNav(wizard, DANGOTE_GROUPS)
  const revealed = useRevealed(wizard, nav.group.steps)
  const done = step > 6

  if (done) {
    return (
      <WizardShell title="Request submitted" description="Price is confirmed after review." footer={false}>
        <DangoteCompletionStep wizard={wizard} />
      </WizardShell>
    )
  }

  return (
    <div className="space-y-8">
      <WizardStepper
        steps={DANGOTE_GROUPS.map((g) => ({ title: g.title, shortTitle: g.shortTitle, icon: g.icon }))}
        step={nav.index + 1}
        onStepClick={nav.goTo}
      />

      <WizardShell
        title={nav.group.title}
        description={nav.group.description}
        errors={errors}
        onBack={nav.back}
        backDisabled={nav.index === 0}
        onNext={nav.isLast ? handlePlaceOrder : nav.next}
        nextLabel={nav.isLast ? 'Submit request' : 'Continue'}
        nextPending={createDangoteOrderRequestMutation?.isPending}
      >
        <div className="space-y-8">
          {revealed.map((s) => {
            const i = nav.group.steps.indexOf(s)
            return (
            <Section
              key={s}
              label={nav.group.sections?.[i]}
              index={nav.group.sections ? i + 1 : undefined}
            >
              {s === 1 && <DangoteCustomerStep wizard={wizard} />}
              {s === 2 && <DangoteCompanyLicenseStep wizard={wizard} />}
              {s === 3 && <DangoteProductStep wizard={wizard} />}
              {s === 4 && <DangoteQuantityStep wizard={wizard} />}
              {s === 5 && <DangoteDeliveryStep wizard={wizard} />}
              {s === 6 && <DangoteReviewStep wizard={wizard} />}
            </Section>
            )
          })}
        </div>
      </WizardShell>
    </div>
  )
}

function LpgFlow() {
  const wizard = useLpgOrderWizard()
  const { step, errors, handlePlaceOrder, createLpgOrderRequestMutation } = wizard
  const nav = useGroupNav(wizard, LPG_GROUPS)
  const revealed = useRevealed(wizard, nav.group.steps)
  const done = step > 5

  if (done) {
    return (
      <WizardShell title="Request submitted" description="Price is confirmed after review." footer={false}>
        <LpgCompletionStep wizard={wizard} />
      </WizardShell>
    )
  }

  return (
    <div className="space-y-8">
      <WizardStepper
        steps={LPG_GROUPS.map((g) => ({ title: g.title, shortTitle: g.shortTitle, icon: g.icon }))}
        step={nav.index + 1}
        onStepClick={nav.goTo}
      />

      <WizardShell
        title={nav.group.title}
        description={nav.group.description}
        errors={errors}
        onBack={nav.back}
        backDisabled={nav.index === 0}
        onNext={nav.isLast ? handlePlaceOrder : nav.next}
        nextLabel={nav.isLast ? 'Submit request' : 'Continue'}
        nextPending={createLpgOrderRequestMutation?.isPending}
      >
        <div className="p-3.5 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-3 mb-6">
          <Zap className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">DVA Auto-Subaccount Settlement:</span> Upon approving this LPG cooking gas order, the customer&apos;s Dedicated Virtual Account (DVA) is automatically switched to the selected LPG station&apos;s Paystack Subaccount so all payments land directly in the station&apos;s account.
          </div>
        </div>

        <div className="space-y-8">
          {revealed.map((s) => {
            const i = nav.group.steps.indexOf(s)
            return (
            <Section
              key={s}
              label={nav.group.sections?.[i]}
              index={nav.group.sections ? i + 1 : undefined}
            >
              {s === 1 && <LpgCustomerStep wizard={wizard} />}
              {s === 2 && <LpgStationStep wizard={wizard} />}
              {s === 3 && <LpgCylinderStep wizard={wizard} />}
              {s === 4 && <LpgDeliveryStep wizard={wizard} />}
              {s === 5 && <LpgReviewStep wizard={wizard} />}
            </Section>
            )
          })}
        </div>
      </WizardShell>
    </div>
  )
}

function CreateOrderPage() {
  const navigate = useNavigate()
  const [orderType, setOrderType] = useState<OrderType | null>(null)

  return (
    <div className="animate-fade-in mx-auto w-full max-w-3xl space-y-8 py-2">
      <PageHeader
      eyebrow="Orders"
      title="Place a customer order"
      description="Choose where the order is lifted from — the steps appear below."
    />

      <div className="space-y-2">
        <p className={cn(MICRO, 'text-muted-foreground')}>Order type</p>
        <SegmentedChoice
          label="Order type"
          value={orderType}
          onChange={setOrderType}
          options={[
            {
              value: 'depot',
              label: 'Buy from Our Depots',
              hint: 'Order petroleum products from Soroman depots across Nigeria for pickup or delivery.',
              icon: <Truck />,
            },
            {
              value: 'dangote',
              label: 'Dangote Delivery',
              hint: 'Place bulk orders for petroleum products delivered directly from Dangote Refinery.',
              icon: <Building2 />,
            },
            // {
            //   value: 'lpg',
            //   label: 'Cooking Gas',
            //   hint: 'Get cooking gas delivered safely and conveniently to your doorstep.',
            //   icon: <Flame />,
            // },
          ]}
        />
      </div>

      {/* The wizard mounts in place. Switching type remounts it, which is the
          honest behaviour — the two flows share no fields. */}
      {orderType === 'depot' && <DepotFlow key="depot" />}
      {orderType === 'dangote' && <DangoteFlow key="dangote" />}
      {orderType === 'lpg' && <LpgFlow key="lpg" />}

      {!orderType && (
        <p className="pt-2 text-center text-sm text-muted-foreground">
          Pick an order type to begin.
        </p>
      )}
    </div>
  )
}
