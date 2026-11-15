/** "2026-12-25" → "Friday 25 December" (in the reader's own language). */
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Pull the friendly message out of an API error. */
export function errorMessage(error: unknown): string {
  const data = (error as { data?: { message?: string } })?.data
  if (data?.message) return data.message
  return 'Oops! Something went wrong. Check your internet and try again.'
}
