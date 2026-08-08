import { useState } from 'react'
import { format } from 'date-fns'
import { Loader2, Paperclip } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { Badge } from '#/components/ui/badge'
import { MICRO } from '#/lib/panel'
import { cn } from '#/lib/utils'
import {
  useExpenseDetail, useReviewExpense, ACTION_META, STATUS_TONE,
  type PfiExpense, type ExpenseAction,
} from '#/lib/hooks/usePfis'
import { naira } from '#/routes/pfi/-pfi-utils'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value || '—'}</span>
    </div>
  )
}

/** The four-step counter. People want to know how much further it has to go. */
export function StepBadge({ expense }: { expense: PfiExpense }) {
  const terminal = expense.status === 'rejected' || expense.status === 'paid'
  return (
    <Badge className={cn('gap-1.5', STATUS_TONE[expense.status])}>
      {expense.status_label}
      {!terminal && (
        <span className="opacity-70">
          {expense.status_step} of {expense.total_steps}
        </span>
      )}
    </Badge>
  )
}

export function ExpenseReviewDrawer({
  expenseId, open, onOpenChange, onEdit,
}: {
  expenseId: number | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onEdit: (e: PfiExpense) => void
}) {
  const { data: expense, isLoading } = useExpenseDetail(open ? expenseId : null)
  const review = useReviewExpense()
  const [pending, setPending] = useState<ExpenseAction | null>(null)
  const [note, setNote] = useState('')

  const run = async (action: ExpenseAction) => {
    const meta = ACTION_META[action]
    // Reject and send-back are refused server-side without a reason, so ask
    // for it here rather than round-tripping to be told.
    if (meta.needsNote && !note.trim()) { setPending(action); return }
    await review.mutateAsync({ id: expense!.id, action, note })
    setNote('')
    setPending(null)
  }

  const reasons = (expense?.history || []).filter((h) => h.changes?.note)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-xl">
        {isLoading || !expense ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin" /></div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <DialogTitle>{naira(Number(expense.amount))}</DialogTitle>
                  <DialogDescription>
                    {expense.vendor || 'Unnamed payee'} · {expense.category_name}
                  </DialogDescription>
                </div>
                <StepBadge expense={expense} />
              </div>
            </DialogHeader>

            <div className="divide-y divide-foreground/10">
              <div className="pb-2">
                <Row label="Date" value={format(new Date(expense.expense_date), 'd MMM yyyy')} />
                <Row label="Description" value={expense.description} />
                <Row label="Cargo" value={expense.pfi_number || 'General overhead'} />
                <Row label="Raised by" value={expense.submitted_by_name} />
              </div>

              <div className="py-2">
                <p className={cn(MICRO, 'pb-1 text-muted-foreground')}>Payment</p>
                <Row label="From" value={expense.bank_paid_from} />
                <Row label="To" value={expense.payee_account_name} />
                <Row
                  label="Account"
                  value={[expense.payee_bank_name, expense.payee_account_number].filter(Boolean).join(' · ')}
                />
                <Row label="Reference" value={expense.receipt_reference} />
              </div>

              {expense.attachment_count ? (
                <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                  <Paperclip className="size-4" />
                  {expense.attachment_count} attachment{expense.attachment_count === 1 ? '' : 's'}
                </div>
              ) : null}

              {/* Read from the audit trail, not review_note — that column holds
                  only the latest reason and is wiped when a corrected request
                  is resubmitted. */}
              {reasons.length > 0 && (
                <div className="space-y-2 py-3">
                  <p className={cn(MICRO, 'text-muted-foreground')}>Review history</p>
                  {reasons.map((h, i) => (
                    <div key={i} className="rounded-lg border border-foreground/15 p-2.5">
                      <p className="text-xs text-muted-foreground">
                        {h.actor_name || 'Someone'} · {format(new Date(h.created_at), 'd MMM, HH:mm')}
                      </p>
                      <p className="text-sm">{h.changes?.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* The page renders whatever the server says is allowed and decides
                nothing itself — including why there is nothing to do. */}
            {expense.available_actions.length > 0 ? (
              <div className="space-y-3">
                {pending && (
                  <div className="space-y-1.5">
                    <label className={cn(MICRO, 'block text-muted-foreground')}>
                      Reason for {ACTION_META[pending].label.toLowerCase()}
                    </label>
                    <Textarea
                      autoFocus rows={2} value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Required — the submitter sees this"
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {expense.available_actions.map((a) => (
                    <Button
                      key={a}
                      className={cn(!ACTION_META[a].needsNote && ACTION_META[a].tone)}
                      variant={ACTION_META[a].needsNote ? 'outline' : 'default'}
                      disabled={review.isPending || (pending === a && !note.trim())}
                      onClick={() => run(a)}
                    >
                      {review.isPending && <Loader2 className="animate-spin" />}
                      {ACTION_META[a].label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-foreground/15 bg-muted/40 p-3 text-sm text-muted-foreground">
                {expense.action_blocked_reason}
              </p>
            )}

            <DialogFooter>
              {/* After a reject or send-back, editing is always the next thing
                  the submitter does. */}
              {(expense.status === 'rejected' || expense.status === 'changes_requested') && (
                <Button variant="outline" onClick={() => { onOpenChange(false); onEdit(expense) }}>
                  Correct and resubmit
                </Button>
              )}
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
