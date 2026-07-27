import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import {
  Users,
  UserCheck,
  ArrowUpRight,
  Calendar,
  Building,
  GraduationCap,
  TrendingUp,
  Shield,
  Loader2,
} from 'lucide-react'
import { useDashboardStats } from '#/lib/hooks/useDashboard'
import { useAuthStore } from '#/modules/auth'

export const Route = createFileRoute('/overview/')({
  component: OverviewDashboard,
})

function OverviewDashboard() {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useDashboardStats()
  const user = useAuthStore((s) => s.user)

  const truckStats = stats?.trucks || { total: 0, inTransit: 0, idle: 0, maintenance: 0 }
  const driverStats = stats?.drivers || { total: 0, active: 0, onTrip: 0, offDuty: 0 }
  const depotStats = stats?.depots || { total: 0 }
  const productStats = stats?.products || { total: 0, categories: 0 }

  const overviewStats = [
    { title: 'Total Trucks', value: truckStats.total, change: `${truckStats.inTransit} in transit`, trend: 'up', icon: Users },
    { title: 'Active Drivers', value: driverStats.active, change: `${driverStats.total} total`, trend: 'up', icon: UserCheck },
    { title: 'Depots', value: depotStats.total, change: 'All operational', trend: 'stable', icon: Building },
    { title: 'Products', value: productStats.total, change: `${productStats.categories} categories`, trend: 'up', icon: GraduationCap },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || 'Admin'}. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/trucks/' as any })}>
            <Users className="w-4 h-4 mr-2" />
            View Fleet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, idx) => (
          <Card key={idx} className="stats-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === 'up' && (
                  <TrendingUp className="w-3 h-3 text-success" />
                )}
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Fleet Status
              <Badge variant="secondary">Live</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'In Transit', count: truckStats.inTransit, total: truckStats.total, color: 'bg-success' },
                { label: 'Idle', count: truckStats.idle, total: truckStats.total, color: 'bg-warning' },
                { label: 'Maintenance', count: truckStats.maintenance, total: truckStats.total, color: 'bg-destructive' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-foreground font-medium truncate">
                    {item.label}
                  </div>
                  <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                    <div
                      className={`h-full rounded-lg ${item.color} animate-bar-grow`}
                      style={{ width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%`, animationDelay: `${idx * 100}ms` }}
                    />
                  </div>
                  <div className="w-10 text-right text-sm font-semibold text-foreground tabular-nums">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{truckStats.total} trucks</span>
              </div>
              <Button variant="link" className="h-auto p-0 text-sm" onClick={() => navigate({ to: '/trucks/' as any })}>
                View Details <ArrowUpRight size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Driver Status</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[
                { label: 'Active', count: driverStats.active, color: 'text-success' },
                { label: 'On Trip', count: driverStats.onTrip, color: 'text-warning' },
                { label: 'Off Duty', count: driverStats.offDuty, color: 'text-muted-foreground' },
              ].map((item, idx) => (
                <div key={idx} className="px-6 py-4 flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.color}`}>{item.count}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <Button variant="link" className="w-full text-center text-sm" onClick={() => navigate({ to: '/drivers/' as any })}>
                View All Drivers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: GraduationCap, label: 'Total Drivers', value: String(driverStats.total), sub: `${driverStats.active} active` },
          { icon: Shield, label: 'Idle Trucks', value: String(truckStats.idle), sub: 'Available at depots' },
          { icon: UserCheck, label: 'On Trip', value: String(driverStats.onTrip), sub: 'Currently delivering' },
          { icon: Calendar, label: 'In Maintenance', value: String(truckStats.maintenance), sub: 'Scheduled service' },
        ].map((item, idx) => (
          <Card key={idx} className="stats-card">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <item.icon className="w-8 h-8 text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
