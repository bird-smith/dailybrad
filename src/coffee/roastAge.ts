const DAY_MS = 24 * 60 * 60 * 1000

/** Today's date as YYYY-MM-DD, in local time. */
export function localDateString(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Whole calendar days from the roast date to today, in local time. Both days are turned
// into midnight UTC first, so clock changes can't make a day 23 or 25 hours long.
export function daysSinceRoast(roastDate: string | null, now: Date): number | null {
  if (!roastDate) return null
  const [y, m, d] = roastDate.split('-').map(Number)
  const roast = Date.UTC(y, m - 1, d)
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((today - roast) / DAY_MS)
}

export function roastAgeLabel(days: number | null): string | null {
  if (days === null) return null
  // A roast date "tomorrow" can only be a time-zone slip between devices: call it today.
  if (days <= 0) return 'Roasted today'
  if (days === 1) return 'Roasted yesterday'
  return `Roasted ${days} days ago`
}
