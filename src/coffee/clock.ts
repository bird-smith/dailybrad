// Times typed like a microwave: the last two digits are seconds ("300" is 3:00), so the
// phone's number keypad, which has no colon, is enough. "3:00" works too.

const MAX_SECONDS = 60 * 60

export type ClockCheck = { ok: true; seconds: number | null } | { ok: false; message: string }

export function parseClock(text: string): ClockCheck {
  const trimmed = text.trim()
  if (!trimmed) return { ok: true, seconds: null }
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed) ?? /^(\d{0,2})(\d{2})$/.exec(trimmed.padStart(2, '0'))
  if (!match || !/^[\d:]+$/.test(trimmed)) return { ok: false, message: 'Type a time like 45 or 300 (for 3:00).' }
  const minutes = Number(match[1] || '0')
  const seconds = Number(match[2])
  if (seconds > 59) return { ok: false, message: 'Seconds go up to 59. Type 130 for 1:30.' }
  const total = minutes * 60 + seconds
  if (total > MAX_SECONDS) return { ok: false, message: 'Keep times under an hour.' }
  return { ok: true, seconds: total }
}

export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
