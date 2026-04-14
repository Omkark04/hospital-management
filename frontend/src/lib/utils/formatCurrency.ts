/**
 * Format a number as Indian Rupee currency.
 * Example: 42500 → "₹42,500.00"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Compact format for large numbers.
 * Example: 150000 → "₹1.5L"
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 10_00_000) return `₹${(amount / 10_00_000).toFixed(1)}Cr`
  if (amount >= 1_00_000)  return `₹${(amount / 1_00_000).toFixed(1)}L`
  if (amount >= 1_000)     return `₹${(amount / 1_000).toFixed(1)}K`
  return `₹${amount}`
}
