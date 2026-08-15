import { useState } from 'react'
import { Input } from '#/components/ui/input'
import { NativeSelect } from '#/components/ui/native-select'
import { useVendors } from '#/lib/hooks/useVendors'

const OTHER = '__other__'

export interface VendorFieldValue {
  vendor: string
  vendor_id: string
  /** Only meaningful while `vendor_id` is empty — create it on submit. */
  saveNew: boolean
}

/**
 * Select an existing vendor, or type a new one and optionally save it.
 *
 * Deliberately a NativeSelect + a plain Input rather than a combobox — this
 * codebase has no autocomplete primitive, and a "select, or Other…" toggle
 * needs none.
 */
export function VendorField({ value, onChange }: { value: VendorFieldValue; onChange: (v: VendorFieldValue) => void }) {
  const { data: vendors = [] } = useVendors({ status: 'Active' })
  const [mode, setMode] = useState<'select' | 'manual'>(value.vendor_id || !value.vendor ? 'select' : 'manual')

  if (mode === 'select') {
    return (
      <NativeSelect
        value={value.vendor_id}
        onChange={(e) => {
          const id = e.target.value
          if (id === OTHER) {
            setMode('manual')
            onChange({ vendor: '', vendor_id: '', saveNew: true })
            return
          }
          const picked = vendors.find((v) => String(v.id) === id)
          onChange({ vendor: picked?.name || '', vendor_id: id, saveNew: false })
        }}
      >
        <option value="">Select a vendor…</option>
        {vendors.map((v) => (
          <option key={v.id} value={String(v.id)}>{v.name}</option>
        ))}
        <option value={OTHER}>Other (type a new vendor)…</option>
      </NativeSelect>
    )
  }

  return (
    <div className="space-y-1.5">
      <Input
        value={value.vendor}
        onChange={(e) => onChange({ ...value, vendor: e.target.value, vendor_id: '' })}
        placeholder="Vendor name"
      />
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="size-3.5"
            checked={value.saveNew}
            onChange={(e) => onChange({ ...value, saveNew: e.target.checked })}
          />
          Save this vendor for future use
        </label>
        {vendors.length > 0 && (
          <button
            type="button"
            className="text-xs text-primary hover:underline shrink-0"
            onClick={() => { setMode('select'); onChange({ vendor: '', vendor_id: '', saveNew: false }) }}
          >
            Choose existing vendor
          </button>
        )}
      </div>
    </div>
  )
}
