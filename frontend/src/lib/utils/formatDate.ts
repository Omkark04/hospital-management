/**
 * Format a date string or Date object to Indian locale display.
 * Example: "2025-12-15" → "15 Dec 2025"
 */
export function formatDate(value: string | Date, style: Intl.DateTimeFormatOptions['dateStyle'] = 'medium'): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: style }).format(date)
}

/**
 * Format date + time.
 * Example: "15 Dec 2025, 3:30 PM"
 */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}
