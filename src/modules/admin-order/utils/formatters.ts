export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value)
}

export function formatAccountName(name?: string) {
  if (!name) return 'N/A';
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase())
    .join(' ');
  return `SOROMANNIGERI/ ${initials}`;
}
