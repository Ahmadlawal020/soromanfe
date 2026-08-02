/**
 * Per-depot contact numbers printed in the waybill footer.
 *
 * ⚠️ THESE ARE PLACEHOLDERS. Replace each entry with the real per-depot desk
 * numbers before this reaches a driver's hand — a waybill that prints a wrong
 * number is worse than one that prints none.
 *
 * The previous implementation had no rule for Warri, so Warri tickets fell
 * through to a default that dumped every number in the system onto the sheet.
 * That is fixed two ways here: every depot has an entry, and the fallback is a
 * single switchboard line rather than a list.
 */

/** Shown when a depot has no entry — one number, never a dump of all of them. */
const SWITCHBOARD = ['0700 SOROMAN']

const BY_DEPOT: Record<string, string[]> = {
  'apapa terminal': ['0903 028 2499', '0906 415 7788'],
  'tin can island depot': ['0903 028 2499', '0906 415 7788'],
  'ibafo depot': ['0903 028 2499'],
  'calabar terminal': ['0903 025 2499'],
  'port harcourt depot': ['0908 771 3355'],
  'warri terminal': ['0907 442 1180'],
  'oghara depot': ['0907 442 1180'],
  'koko depot': ['0907 442 1180'],
}

/** Loose match, so "Calabar Soroman Depot" still finds the Calabar entry. */
export function depotPhones(depotName?: string | null): string[] {
  const key = String(depotName || '').trim().toLowerCase()
  if (!key) return SWITCHBOARD

  if (BY_DEPOT[key]) return BY_DEPOT[key]

  const partial = Object.keys(BY_DEPOT).find(
    (k) => key.includes(k.split(' ')[0]) || k.includes(key.split(' ')[0]),
  )
  return partial ? BY_DEPOT[partial] : SWITCHBOARD
}

/**
 * Truck suffix for multi-truck orders: 1 → A, 26 → Z, 27 → AA.
 *
 * Single-truck orders print the bare reference, so callers should skip this.
 */
export function truckSuffix(index: number): string {
  let n = Math.max(1, Math.floor(index))
  let out = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    out = String.fromCharCode(65 + rem) + out
    n = Math.floor((n - 1) / 26)
  }
  return out
}
