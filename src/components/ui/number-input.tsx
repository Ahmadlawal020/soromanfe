import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'

/**
 * A number field that reads with thousands separators as you type.
 *
 * Comma formatting is display-only: `onValueChange` always hands back the
 * unformatted string, because everything downstream runs it through Number()
 * and `Number("45,000")` is NaN — which would submit a broken figure rather
 * than fail loudly.
 *
 * Deliberately `type="text"` with `inputMode="numeric"`. A native
 * `type="number"` cannot display commas at all (the browser rejects the value
 * as malformed), and brings a spinner and scroll-to-change that nobody wants
 * on a money field.
 *
 * This replaces four hand-rolled copies of the same caret-preservation dance.
 */

const strip = (v: string, allowDecimal: boolean) =>
  allowDecimal ? v.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') : v.replace(/\D/g, '')

/**
 * Group the integer part, leave the decimal part alone — reformatting digits
 * after the point would fight the person typing "1234.5" mid-keystroke.
 * A trailing "." is preserved so it can still be typed.
 */
function format(raw: string, allowDecimal: boolean): string {
  if (!raw) return ''
  if (!allowDecimal) {
    const d = strip(raw, false)
    return d ? Number(d).toLocaleString('en-NG') : ''
  }
  const cleaned = strip(raw, true)
  const [whole, ...rest] = cleaned.split('.')
  const grouped = whole ? Number(whole).toLocaleString('en-NG') : ''
  if (rest.length === 0) return cleaned.endsWith('.') ? `${grouped}.` : grouped
  return `${grouped}.${rest.join('')}`
}

/** How many value-carrying characters sit left of the caret. */
const significantBefore = (s: string, allowDecimal: boolean) => strip(s, allowDecimal).length

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  /** The raw, unformatted value. Empty string shows the placeholder. */
  value: string | number | null | undefined
  /** Receives the raw, unformatted string — never the comma'd display form. */
  onValueChange: (raw: string) => void
  /** Money and rates need a decimal point; litres and counts do not. */
  allowDecimal?: boolean
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
  { value, onValueChange, allowDecimal = false, className, ...props },
  forwardedRef,
) {
  const innerRef = useRef<HTMLInputElement>(null)
  const ref = (forwardedRef as React.RefObject<HTMLInputElement>) ?? innerRef
  const [caret, setCaret] = useState<number | null>(null)

  const raw = value == null ? '' : String(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target
    // Count value-carrying characters left of the caret, not characters:
    // reformatting moves the commas, and a plain index would drift past them.
    const before = significantBefore(el.value.slice(0, el.selectionStart ?? 0), allowDecimal)
    const next = strip(el.value, allowDecimal)
    onValueChange(next)

    // Where that same character lands once the commas are re-inserted.
    const formatted = format(next, allowDecimal)
    let seen = 0
    let pos = formatted.length
    for (let i = 0; i < formatted.length; i += 1) {
      if (/[\d.]/.test(formatted[i])) seen += 1
      if (seen === before) { pos = i + 1; break }
    }
    setCaret(before === 0 ? 0 : pos)
  }

  // Restore the caret after React paints the reformatted value, or it jumps
  // to the end on every keystroke.
  useLayoutEffect(() => {
    if (caret != null && ref.current) {
      ref.current.setSelectionRange(caret, caret)
      setCaret(null)
    }
  }, [caret, ref])

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      autoComplete="off"
      value={format(raw, allowDecimal)}
      onChange={handleChange}
      className={cn(className)}
    />
  )
})
