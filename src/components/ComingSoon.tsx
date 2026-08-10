import { Construction } from 'lucide-react'

import { PageHeader } from '#/components/PageHeader'
import { PANEL } from '#/lib/panel'
import { cn } from '#/lib/utils'

/**
 * A page that exists in the navigation but has no content yet.
 *
 * These are placeholders on purpose: the nav was built out first so the
 * information architecture could be agreed before any of it was written. A
 * real page replaces the whole route file — there is nothing here to extend.
 *
 * It says plainly that it is unbuilt rather than showing an empty table, which
 * reads as a page that is broken or has lost its data.
 */
export function ComingSoon({
  eyebrow,
  title,
  description,
  planned,
}: {
  eyebrow: string
  title: string
  description?: string
  /** What this page will hold, so the placeholder still tells you something. */
  planned?: string[]
}) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      <section className={cn(PANEL, 'p-10 text-center')}>
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Construction className="size-5" />
        </div>
        <p className="mt-4 text-sm font-semibold">Not built yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          This page is in the navigation so the structure is settled. The content comes next.
        </p>

        {planned && planned.length > 0 && (
          <ul className="mx-auto mt-5 max-w-md space-y-1.5 text-left">
            {planned.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-foreground/30" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
