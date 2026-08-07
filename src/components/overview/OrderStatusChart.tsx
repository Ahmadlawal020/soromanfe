import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface StatusSlice {
  name: string
  value: number
  color: string
}

interface OrderStatusChartProps {
  data: StatusSlice[]
  total: number
}

const STATUS_COLORS: Record<string, string> = {
  Completed: 'var(--chart-1)',
  Loading: 'var(--chart-2)',
  Released: 'var(--chart-3)',
  Paid: 'var(--chart-4)',
  Pending: 'var(--chart-5)',
  Cancelled: 'var(--destructive)',
  Expired: 'var(--muted-foreground)',
}

export function OrderStatusChart({ data, total }: OrderStatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No orders for this period
      </div>
    )
  }

  const slices = data.map((d) => ({
    ...d,
    color: STATUS_COLORS[d.name] || 'var(--muted-foreground)',
  }))

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={slices}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {slices.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value, name) => [`${value} orders`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold">{total}</span>
        <span className="text-xs text-muted-foreground">orders</span>
      </div>
    </div>
  )
}
