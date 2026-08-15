import { useState } from 'react'
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#/components/ui/dialog'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { NativeSelect } from '#/components/ui/native-select'
import { MICRO } from '#/lib/panel'
import { cn } from '#/lib/utils'
import {
  useExpenseCategories, useCreateGlAccount, useUpdateGlAccount, useDeleteGlAccount,
  type ExpenseCategory, type GlGroup,
} from '#/lib/hooks/usePfis'
/**
 * The next free code in a group, spaced by ten.
 *
 * The seeded chart leaves gaps on purpose — 6110, 6120, 6130 — so an account
 * can be slotted in later without renumbering everything after it. Suggesting
 * the next multiple keeps that property instead of quietly filling the gaps.
 */
function nextCode(group: GlGroup | undefined) {
  const codes = (group?.accounts || [])
    .map((a) => Number(a.gl_code))
    .filter((n) => Number.isFinite(n))
  if (codes.length === 0) return ''
  const top = Math.max(...codes)
  // Stay inside the group's thousand block; if the next step would leave it,
  // fall back to filling the last gap.
  const stepped = Math.floor(top / 10) * 10 + 10
  return String(Math.floor(stepped / 1000) === Math.floor(top / 1000) ? stepped : top + 1)
}

const BLANK = { name: '', gl_code: '', gl_group: '', gl_subgroup: '' }

function AccountRow({ account }: { account: ExpenseCategory }) {
  const update = useUpdateGlAccount()
  const remove = useDeleteGlAccount()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({
    name: account.name,
    gl_code: account.gl_code || '',
    gl_subgroup: account.gl_subgroup || '',
  })

  const inUse = account.expense_count ?? 0
  const start = () => {
    setDraft({
      name: account.name,
      gl_code: account.gl_code || '',
      gl_subgroup: account.gl_subgroup || '',
    })
    setEditing(true)
  }

  const save = async () => {
    if (!draft.name.trim()) return
    await update.mutateAsync({ id: account.id, data: draft })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="grid items-center gap-2 border-b border-foreground/10 py-2 sm:grid-cols-[5rem_1fr_9rem_auto]">
        <Input
          value={draft.gl_code} placeholder="Code"
          onChange={(e) => setDraft((d) => ({ ...d, gl_code: e.target.value }))}
        />
        <Input
          autoFocus value={draft.name} placeholder="Account name"
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        />
        <Input
          value={draft.gl_subgroup} placeholder="Heading (optional)"
          onChange={(e) => setDraft((d) => ({ ...d, gl_subgroup: e.target.value }))}
        />
        <div className="flex justify-end gap-0.5">
          <Button
            variant="ghost" size="icon-sm" title="Save"
            disabled={!draft.name.trim() || update.isPending} onClick={save}
          >
            {update.isPending ? <Loader2 className="animate-spin" /> : <Check />}
            <span className="sr-only">Save</span>
          </Button>
          <Button variant="ghost" size="icon-sm" title="Cancel" onClick={() => setEditing(false)}>
            <X /><span className="sr-only">Cancel</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 border-b border-foreground/10 py-2">
      <span className="w-14 shrink-0 text-sm tabular-nums text-muted-foreground">
        {account.gl_code || '—'}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{account.name}</span>
      {account.gl_subgroup && (
        <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
          {account.gl_subgroup}
        </Badge>
      )}
      {/* The count is the whole explanation for a disabled bin. */}
      <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
        {inUse ? `${inUse} line${inUse === 1 ? '' : 's'}` : ''}
      </span>
      <div className="flex shrink-0 gap-0.5">
        <Button variant="ghost" size="icon-sm" title="Edit" onClick={start}>
          <Pencil /><span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost" size="icon-sm"
          title={inUse ? `In use by ${inUse} expense line(s)` : 'Delete'}
          disabled={inUse > 0 || remove.isPending}
          onClick={() => remove.mutate(account.id)}
        >
          {remove.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  )
}

/**
 * Manage the chart of accounts.
 *
 * One group at a time rather than the whole chart at once: fifty-odd accounts
 * in a flat list is how a wrong code gets edited by mistake, and the group is
 * the thing a new account has to be placed inside anyway.
 */
export function GlAccountsDialog({
  open, onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { data: cats, isLoading } = useExpenseCategories()
  const create = useCreateGlAccount()
  const [groupCode, setGroupCode] = useState('')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(BLANK)

  const groups = cats?.groups || []
  const group = groups.find((g) => g.code === groupCode) || groups[0]

  const startAdd = () => {
    setDraft({ ...BLANK, gl_group: group?.code || '', gl_code: nextCode(group) })
    setAdding(true)
  }

  const submit = async () => {
    if (!draft.name.trim() || !draft.gl_group) return
    await create.mutateAsync(draft)
    setAdding(false)
    setDraft(BLANK)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chart of accounts</DialogTitle>
          <DialogDescription>
            The GL accounts the expense form posts to. An account already carrying
            expense lines can be renamed and renumbered, but not moved to another
            group or deleted.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <NativeSelect
                className="w-64"
                value={group?.code || ''}
                onChange={(e) => { setGroupCode(e.target.value); setAdding(false) }}
              >
                {groups.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.label} ({g.accounts.length})
                  </option>
                ))}
              </NativeSelect>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={startAdd} disabled={!group}>
                <Plus data-icon="inline-start" />
                New account
              </Button>
            </div>

            {group && (
              <p className="text-xs leading-tight text-muted-foreground/70">
                {group.hint}
                {group.isIncome && ' These never appear on the expense form.'}
              </p>
            )}

            {adding && (
              <div className="grid items-center gap-2 rounded-lg border border-foreground/15 p-2.5 sm:grid-cols-[5rem_1fr_9rem_auto]">
                <Input
                  value={draft.gl_code} placeholder="Code"
                  onChange={(e) => setDraft((d) => ({ ...d, gl_code: e.target.value }))}
                />
                <Input
                  autoFocus value={draft.name} placeholder="Account name"
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
                <Input
                  value={draft.gl_subgroup} placeholder="Heading (optional)"
                  onChange={(e) => setDraft((d) => ({ ...d, gl_subgroup: e.target.value }))}
                />
                <div className="flex justify-end gap-0.5">
                  <Button
                    variant="ghost" size="icon-sm" title="Create"
                    disabled={!draft.name.trim() || create.isPending} onClick={submit}
                  >
                    {create.isPending ? <Loader2 className="animate-spin" /> : <Check />}
                    <span className="sr-only">Create</span>
                  </Button>
                  <Button variant="ghost" size="icon-sm" title="Cancel" onClick={() => setAdding(false)}>
                    <X /><span className="sr-only">Cancel</span>
                  </Button>
                </div>
              </div>
            )}

            <div>
              <div className={cn(MICRO, 'flex items-center gap-3 pb-1 text-muted-foreground')}>
                <span className="w-14 shrink-0">Code</span>
                <span className="flex-1">Account name</span>
                <span className="w-16 text-right">In use</span>
                <span className="w-16" />
              </div>
              {group?.accounts.map((a) => (
                <AccountRow key={a.id} account={a} />
              ))}
              {group && group.accounts.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground/70">
                  No accounts in this group yet.
                </p>
              )}
            </div>

            {cats?.unmapped?.length ? (
              <div>
                <p className={cn(MICRO, 'pb-1 text-muted-foreground')}>
                  Pre-chart categories ({cats.unmapped.length})
                </p>
                <p className="text-xs leading-tight text-muted-foreground/70">
                  Older categories with no GL code. Historical lines still point at
                  them; give one a code and a group to fold it into the chart.
                </p>
                {cats.unmapped.map((a) => (
                  <UnmappedRow key={a.id} account={a} groups={groups} />
                ))}
              </div>
            ) : null}
          </>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * A pre-chart category, with the one edit that matters: giving it a code and a
 * group. Only offered while it is unused — the server refuses a group change on
 * an account that already has lines, and says so.
 */
function UnmappedRow({ account, groups }: { account: ExpenseCategory; groups: GlGroup[] }) {
  const update = useUpdateGlAccount()
  const [code, setCode] = useState('')
  const [groupCode, setGroupCode] = useState('')

  const inUse = account.expense_count ?? 0

  return (
    <div className="grid items-center gap-2 border-b border-foreground/10 py-2 sm:grid-cols-[1fr_5rem_10rem_auto]">
      <span className="min-w-0 truncate text-sm">
        {account.name}
        {inUse > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">{inUse} lines</span>
        )}
      </span>
      <Input value={code} placeholder="Code" onChange={(e) => setCode(e.target.value)} />
      <NativeSelect value={groupCode} onChange={(e) => setGroupCode(e.target.value)}>
        <option value="">Group…</option>
        {groups.map((g) => <option key={g.code} value={g.code}>{g.label}</option>)}
      </NativeSelect>
      <Button
        variant="outline" size="sm"
        disabled={!code.trim() || !groupCode || update.isPending}
        onClick={() =>
          update.mutate({ id: account.id, data: { gl_code: code.trim(), gl_group: groupCode } })
        }
      >
        {update.isPending && <Loader2 className="animate-spin" />}
        Map
      </Button>
    </div>
  )
}
