import { relativeTime } from '#/lib/format'
import { cn } from '#/lib/utils'

interface ActivityItem {
  id: number
  action: string
  actorType: string
  actorName: string
  entityType: string
  entityId: string
  createdAt: string
}

interface ActivityFeedProps {
  data: ActivityItem[]
}

const ACTION_LABELS: Record<string, string> = {
  'order.created': 'Created order',
  'order.paid': 'Paid order',
  'order.released': 'Released order',
  'order.loading': 'Started loading',
  'order.completed': 'Completed order',
  'order.cancelled': 'Cancelled order',
  'order.expired': 'Order expired',
  'customer.created': 'Registered customer',
  'customer.updated': 'Updated customer',
  'deposit.created': 'Recorded deposit',
  'ticket.generated': 'Generated ticket',
  'ticket.redeemed': 'Redeemed ticket',
  'pfi.created': 'Created PFI',
  'pfi.finished': 'Closed PFI',
  'expense.created': 'Recorded expense',
  'truck.created': 'Added truck',
  'driver.created': 'Added driver',
  'delivery.allocated': 'Allocated delivery',
  'delivery.completed': 'Completed delivery',
}

function labelAction(action: string): string {
  return ACTION_LABELS[action] || action.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const ACTOR_BADGE: Record<string, string> = {
  staff: 'bg-accent/10 text-accent',
  customer: 'bg-warning/10 text-warning',
  system: 'bg-muted text-muted-foreground',
}

export function ActivityFeed({ data }: ActivityFeedProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No recent activity
      </div>
    )
  }

  return (
    <div className="divide-y divide-foreground/10">
      {data.map((item) => (
        <div key={item.id} className="flex items-center gap-4 px-6 py-3">
          <span className="w-20 shrink-0 text-xs text-muted-foreground">
            {relativeTime(item.createdAt)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">
            {labelAction(item.action)}
          </span>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase', ACTOR_BADGE[item.actorType] || ACTOR_BADGE.system)}>
            {item.actorName || item.actorType}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {item.entityType} #{item.entityId}
          </span>
        </div>
      ))}
    </div>
  )
}
