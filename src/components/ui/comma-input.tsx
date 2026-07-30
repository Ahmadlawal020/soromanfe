import * as React from 'react'
import { Input } from '#/components/ui/input'
import { cn } from '#/lib/utils'

interface CommaInputProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value: string | number
  onValueChange: (value: string) => void
}

export function CommaInput({ value, onValueChange, className, ...props }: CommaInputProps) {
  const formatDisplayValue = (val: string | number) => {
    if (val === '' || val === undefined || val === null) return ''
    const str = String(val)
    const [integerPart, decimalPart] = str.split('.')
    const cleanInteger = integerPart.replace(/\D/g, '')
    const formattedInteger = cleanInteger ? Number(cleanInteger).toLocaleString('en-US') : ''
    if (decimalPart !== undefined) {
      return `${formattedInteger}.${decimalPart.slice(0, 2)}`
    }
    return formattedInteger
  }

  const [displayValue, setDisplayValue] = React.useState(() => formatDisplayValue(value))

  React.useEffect(() => {
    setDisplayValue(formatDisplayValue(value))
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value
    // allow digits and single dot
    const cleanVal = rawVal.replace(/[^0-9.]/g, '')
    const parts = cleanVal.split('.')
    let sanitized = parts[0]
    if (parts.length > 1) {
      sanitized += '.' + parts.slice(1).join('')
    }
    
    setDisplayValue(formatDisplayValue(sanitized))
    onValueChange(sanitized)
  }

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={cn(className)}
      {...props}
    />
  )
}
