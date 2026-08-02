import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PageHeader } from '#/components/PageHeader'
import { Button } from '#/components/ui/button'
import { StatusChip, LiveDot } from '#/components/ui/status-chip'
import { StatCard, StatCardGrid } from '#/components/ui/stat-card'
import { HoverArrowLink } from '#/components/ui/hover-arrow-link'
import {
  Users,
  UserCheck,
  Calendar,
  Building,
  GraduationCap,
  TrendingUp,
  Shield,
  Loader2,
} from 'lucide-react'
import { cn } from '#/lib/utils'
import { PANEL, MICRO, PANEL_RAIL, PANEL_BODY, PANEL_FOOTER } from '#/lib/panel'
import { useDashboardStats } from '#/lib/hooks/useDashboard'
import { useAuthStore } from '#/modules/auth'

export const Route = createFileRoute('/overview/')({
  component: OverviewDashboard,
})

/** Trend-aware description line for a stat tile. */
function Meta({ text, trend }: { text: string; trend?: boolean }) {
  return (
    <span className="flex items-center gap-1">
      {trend && <TrendingUp className="size-3 text-accent" />}
      {text}
    </span>
  )
}

function OverviewDashboard() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useDashboardStats()
  const user = useAuthStore((s) => s.user)

  const truckStats = stats?.trucks || { total: 0, inTransit: 0, idle: 0, maintenance: 0 }
  const driverStats = stats?.drivers || { total: 0, active: 0, onTrip: 0, offDuty: 0 }
  const depotStats = stats?.depots || { total: 0 }
  const productStats = stats?.products || { total: 0, categories: 0 }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24" role="status" aria-label="Loading">
        <Loader2 className="size-6 animate-spin text-accent" />
      </div>
    )
  }

  const fleetRows = [
    { label: 'In Transit', count: truckStats.inTransit, fill: 'bg-accent' },
    { label: 'Idle', count: truckStats.idle, fill: 'bg-warning' },
    { label: 'Maintenance', count: truckStats.maintenance, fill: 'bg-destructive' },
  ]

  const driverRows = [
    { label: 'Active', count: driverStats.active, tone: 'text-accent' },
    { label: 'On Trip', count: driverStats.onTrip, tone: 'text-warning' },
    { label: 'Off Duty', count: driverStats.offDuty, tone: 'text-muted-foreground' },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
      eyebrow="Overview"
      title="Dashboard"
      description={`Welcome back, {user?.firstName || 'Admin'}. Here&apos;s what&apos;s happening today.`}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/fleet-trucks' as any })}>
          <Users data-icon="inline-start" />
          View fleet
          </Button>
        </>
      }
    />

      <StatCardGrid count={4}>
        <StatCard icon={<Users />} label="Total trucks" value={truckStats.total} description={<Meta trend text={`${truckStats.inTransit} in transit`} />} />
        <StatCard icon={<UserCheck />} label="Active drivers" value={driverStats.active} description={<Meta trend text={`${driverStats.total} total`} />} />
        <StatCard icon={<Building />} label="Depots" value={depotStats.total} description="All operational" />
        <StatCard icon={<GraduationCap />} label="Products" value={productStats.total} description={<Meta trend text={`${productStats.categories} categories`} />} />
      </StatCardGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Fleet status — header rail, body, footer rail. */}
        <section className={PANEL} aria-label="Fleet status">
          <div className={PANEL_RAIL}>
            <span className={MICRO}>Fleet status</span>
            <StatusChip tone="accent" size="rail">
              <LiveDot />
              Live
            </StatusChip>
          </div>

          <div className={PANEL_BODY}>
            <div className="space-y-3">
              {fleetRows.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-28 truncate text-sm">{item.label}</div>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-[width] duration-500 ease-luxe', item.fill)}
                      style={{
                        width: `${truckStats.total > 0 ? (item.count / truckStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="w-10 text-right text-sm font-semibold tabular-nums">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(PANEL_FOOTER, 'justify-between')}>
            <span className="text-xs text-muted-foreground">
              Total: <span className="font-semibold text-foreground tabular-nums">{truckStats.total}</span> trucks
            </span>
            <HoverArrowLink to={'/fleet-trucks' as any}>View details</HoverArrowLink>
          </div>
        </section>

        <section className={PANEL} aria-label="Driver status">
          <div className={PANEL_RAIL}>
            <span className={MICRO}>Driver status</span>
          </div>

          <div className="divide-y divide-foreground/10">
            {driverRows.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-6 py-3.5">
                <span className="text-sm">{item.label}</span>
                <span className={cn('text-sm font-semibold tabular-nums', item.tone)}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          <div className={cn(PANEL_FOOTER, 'justify-end')}>
            <HoverArrowLink to={'/drivers/' as any}>View all drivers</HoverArrowLink>
          </div>
        </section>
      </div>

      <StatCardGrid count={4}>
        <StatCard icon={<GraduationCap />} label="Total drivers" value={driverStats.total} description={`${driverStats.active} active`} />
        <StatCard icon={<Shield />} label="Idle trucks" value={truckStats.idle} description="Available at depots" />
        {/* Plain counts, not alarm states — the brand mark carries them.
            warning/destructive are reserved for things that need attention. */}
        <StatCard icon={<UserCheck />} label="On trip" value={driverStats.onTrip} description="Currently delivering" />
        <StatCard icon={<Calendar />} label="In maintenance" value={truckStats.maintenance} description="Scheduled service" />
      </StatCardGrid>
    </div>
  )
}
