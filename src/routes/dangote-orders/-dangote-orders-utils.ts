export const toNumber = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(value)
}

export const isPaid = (o: any) => String(o?.paymentStatus || '').toLowerCase() === 'paid'

/**
 * A Dangote order is payable (ready to be paid from wallet balance) when:
 * 1. It has been approved by admin (pricing and quote generated)
 * 2. It is unpaid
 * 3. It has not expired
 * 4. The customer's wallet balance covers the total order amount
 */
export function isDangoteOrderPayable(o: any): boolean {
  if (!o) return false
  if (isPaid(o)) return false
  if (o.status !== 'Approved') return false
  if (o.expiredAt && new Date(o.expiredAt).getTime() <= Date.now()) return false
  if (o.expiresAt && new Date(o.expiresAt).getTime() <= Date.now()) return false
  const total = toNumber(o.totalAmount)
  if (total <= 0) return false
  const balance = toNumber(o.customerBalance)
  return balance >= total
}
