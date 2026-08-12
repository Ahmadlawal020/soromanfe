import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { FileText } from 'lucide-react'

import { PageHeader } from '#/components/PageHeader'
import { PageEmpty } from '#/components/PageEmpty'
import { cn } from '#/lib/utils'
import { useRoles } from '#/lib/hooks/useRoles'
import { routeGuard } from '#/lib/route-guard'
import { REPORTS, ROLE_REPORT, ALL_TYPES, type ReportType } from './-report-config'
import { ReportPanel } from './-report-panel'

export const Route = createFileRoute('/my-report/')({
  beforeLoad: () => routeGuard('/my-report'),
  component: MyReportPage,
})

/**
 * One URL, five different reports — which one you get depends on your role.
 *
 * A security officer and a commissions officer share nothing here but the
 * page frame. Super admin gets a tab bar over all five so they can file on
 * behalf of any role.
 *
 * Role only decides what is *rendered*; the server checks who may file and
 * who may delete. Upstream this was localStorage alone, with the API
 * enforcing nothing.
 */
function MyReportPage() {
  const { userRoles, isSuperAdmin } = useRoles()

  const mine = userRoles.map((r) => ROLE_REPORT[r]).filter(Boolean) as ReportType[]
  const available = isSuperAdmin ? ALL_TYPES : [...new Set(mine)]
  const [active, setActive] = useState<ReportType | null>(available[0] ?? null)

  if (available.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="My Reports"
          title="My report"
          description="File your daily return."
        />
        <PageEmpty
          icon={<FileText className="size-6 text-muted-foreground" />}
          title="No report assigned to your role"
          description="Daily returns are filed by security, commissions, compliance and the sales and location managers. If you should be filing one, ask an administrator to add the role."
        />
      </div>
    )
  }

  const current = REPORTS[active ?? available[0]]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My Reports"
        title={current.title}
        description={current.description}
      />

      {/* Only a super admin sees more than one, so the tabs stay hidden for
          everyone who files a single report. */}
      {available.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {available.map((t) => {
            const on = (active ?? available[0]) === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActive(t)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors duration-250 ease-luxe',
                  on
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-foreground/15 text-muted-foreground hover:border-foreground/30',
                )}
              >
                {t === 'sales_manager'
                  ? 'Sales manager'
                  : t === 'product_manager'
                    ? 'Location manager'
                    : REPORTS[t].title}
              </button>
            )
          })}
        </div>
      )}

      {/* Keyed so switching tabs resets the form rather than carrying one
          report's half-filled values into another's fields. */}
      <ReportPanel key={current.type} def={current} />
    </div>
  )
}
