import { useAuthStore } from '#/modules/auth'

/**
 * The chart of accounts belongs to Finance.
 *
 * An Expenditure Officer posts to it all day but does not get to reshape it,
 * so the roster here matches the server's `requireChartRole` exactly. This only
 * hides the door — the API refuses regardless.
 */
const CHART_ROLES = ['super_admin', 'admin', 'finance', 'audit']

export function canManageChart(roles: string[] | undefined) {
  return (roles || []).some((r) => CHART_ROLES.includes(r))
}

export function useCanManageChart() {
  const user = useAuthStore((s) => s.user)
  return canManageChart(user?.roles)
}
