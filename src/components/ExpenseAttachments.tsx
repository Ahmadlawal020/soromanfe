import { useRef, useState } from 'react'
import { Loader2, Paperclip, Trash2, Upload } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { MICRO } from '#/lib/panel'
import { cn, getErrorMessage } from '#/lib/utils'
import { useToast } from '#/lib/hooks/useToast'
import {
  useExpenseAttachments, useAttachFiles, useDeleteAttachment,
  type ExpenseAttachment,
} from '#/lib/hooks/usePfis'
import { uploadExpenseFile, type ExpenseUploadedFile } from '#/lib/hooks/useCloudinaryUpload'

/** What the attach endpoint stores for one uploaded file. */
export type PendingFile = ExpenseUploadedFile

const readableSize = (bytes: number) => {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let u = 0
  while (n >= 1024 && u < units.length - 1) { n /= 1024; u += 1 }
  return `${n < 10 && u > 0 ? n.toFixed(1) : Math.round(n)} ${units[u]}`
}

/**
 * The file picker.
 *
 * No type or size filter anywhere — deliberately. A receipt is whatever the
 * vendor handed over, and refusing a file at upload time just means it never
 * gets attached at all. (Cloudinary applies its own per-file ceiling; a file
 * over it fails there and says so.)
 */
export function FileButton({
  busy, onFiles, label = 'Attach files',
}: {
  busy: boolean
  onFiles: (files: FileList) => void
  label?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={input} type="file" multiple className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files)
          // Cleared so re-picking the same file still fires a change.
          e.target.value = ''
        }}
      />
      <Button
        type="button" variant="outline" size="sm" disabled={busy}
        onClick={() => input.current?.click()}
      >
        {busy ? <Loader2 className="animate-spin" /> : <Upload data-icon="inline-start" />}
        {busy ? 'Uploading…' : label}
      </Button>
    </>
  )
}

export function FileRow({
  name, size, href, onRemove, removing,
}: {
  name: string
  size: number
  href?: string
  onRemove?: () => void
  removing?: boolean
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-foreground/15 px-2.5 py-1.5">
      <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
      {href ? (
        <a
          href={href} target="_blank" rel="noreferrer"
          className="min-w-0 flex-1 truncate text-sm underline-offset-2 hover:underline"
        >
          {name}
        </a>
      ) : (
        <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
      )}
      <span className="shrink-0 text-xs text-muted-foreground">{readableSize(size)}</span>
      {onRemove && (
        <Button
          variant="ghost" size="icon-sm" title="Remove" disabled={removing} onClick={onRemove}
        >
          {removing ? <Loader2 className="animate-spin" /> : <Trash2 />}
          <span className="sr-only">Remove</span>
        </Button>
      )}
    </div>
  )
}

/**
 * Attachments on a request that already exists — the drawer, and the edit form.
 * Files register the moment they finish uploading.
 */
export function ExpenseAttachments({ expenseId, canEdit = true }: { expenseId: number; canEdit?: boolean }) {
  const { data: files, isLoading } = useExpenseAttachments(expenseId)
  const attach = useAttachFiles()
  const remove = useDeleteAttachment()
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const onFiles = async (list: FileList) => {
    setBusy(true)
    try {
      const uploaded = await Promise.all([...list].map(uploadExpenseFile))
      await attach.mutateAsync({ id: expenseId, files: uploaded })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className={cn(MICRO, 'text-muted-foreground')}>
          Attachments{files?.length ? ` (${files.length})` : ''}
        </p>
        {canEdit && <FileButton busy={busy} onFiles={onFiles} />}
      </div>

      {isLoading ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : files?.length ? (
        <div className="space-y-1.5">
          {files.map((f: ExpenseAttachment) => (
            <FileRow
              key={f.id}
              name={f.file_name || 'Document'}
              size={f.size_bytes}
              href={f.storage_key}
              removing={remove.isPending}
              onRemove={
                canEdit
                  ? () => remove.mutate({ attachmentId: f.id, expenseId })
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/70">
          Nothing attached. Invoices, teller slips, anything supporting the request.
        </p>
      )}
    </div>
  )
}

/**
 * Attachments on a request that does not exist yet.
 *
 * A new request has no id to register against, so files upload immediately and
 * are held here; the form registers them once the request is created. Uploading
 * up front rather than on submit means a slow connection fails at the moment
 * the file is chosen, not after the person has finished typing.
 */
export function PendingAttachments({
  files, onChange,
}: {
  files: PendingFile[]
  onChange: (next: PendingFile[]) => void
}) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const onFiles = async (list: FileList) => {
    setBusy(true)
    try {
      const uploaded = await Promise.all([...list].map(uploadExpenseFile))
      onChange([...files, ...uploaded])
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className={cn(MICRO, 'text-muted-foreground')}>
          Attachments{files.length ? ` (${files.length})` : ''}
        </p>
        <FileButton busy={busy} onFiles={onFiles} />
      </div>
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f) => (
            <FileRow
              key={f.publicId}
              name={f.fileName}
              size={f.sizeBytes}
              href={f.url}
              onRemove={() => onChange(files.filter((x) => x.publicId !== f.publicId))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
