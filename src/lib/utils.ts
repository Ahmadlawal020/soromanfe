import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(err: any): string {
  return err?.response?.data?.message || err?.message || 'An unexpected error occurred'
}

export function toNum(v: string | number | undefined | null): number {
  if (v === undefined || v === null || v === '') return 0
  if (typeof v === 'number') return v
  const cleaned = String(v).replace(/[^0-9.\-]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}
