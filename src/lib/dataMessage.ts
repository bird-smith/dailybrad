// Turns a database error into one plain sentence. Shared by every screen that loads or
// saves, in any section. Never shows the raw technical text.

export type DataAction = 'save' | 'load' | 'delete' | 'export' | 'import'

type ErrorLike = { status?: unknown; code?: unknown; message?: unknown; name?: unknown }

type Kind = 'cantReach' | 'signedOut' | 'general'

const SIGNED_OUT_CODES = ['PGRST301', 'PGRST303', '42501']
// The database refusing a row: missing value, broken link, already there, out of range.
const REFUSED_CODES = ['23502', '23503', '23505', '23514']
const NETWORK_TEXT = /failed to fetch|networkerror|load failed|network request failed/i

function kindOf(error: unknown, online: boolean): Kind {
  if (!online) return 'cantReach'
  if (typeof error !== 'object' || error === null) return 'general'
  const { status, code, message, name } = error as ErrorLike
  if (status === 401 || SIGNED_OUT_CODES.includes(code as string)) return 'signedOut'
  if (typeof message === 'string' && NETWORK_TEXT.test(message)) return 'cantReach'
  if (name === 'AbortError' || name === 'TypeError') return 'cantReach'
  if (status === undefined || status === 0) return 'cantReach'
  if (typeof status === 'number' && status >= 500) return 'cantReach'
  return 'general'
}

/** what: for loads, what couldn't be loaded, e.g. "your beans". */
export function dataMessage(error: unknown, action: DataAction, online: boolean, what = 'this'): string {
  const kind = kindOf(error, online)
  if (action === 'load') {
    if (kind === 'cantReach') return `Can't load ${what} right now. Check your connection.`
    if (kind === 'signedOut') return `Can't load ${what}: you've been signed out. Sign in again in a new tab.`
    return `Can't load ${what} right now.`
  }
  if (action === 'import') {
    if (kind === 'cantReach') return "Couldn't finish: can't reach the internet."
    if (kind === 'signedOut') return "Couldn't finish: you've been signed out. Sign in again in a new tab."
    if (REFUSED_CODES.includes((error as ErrorLike | null)?.code as string)) {
      return 'The database refused part of this backup, so it stopped there. Choose the same file again; if this keeps happening, the file may have been changed by hand.'
    }
    return "Couldn't finish. Try again in a minute."
  }
  const verb = action
  if (kind === 'cantReach') {
    const kept = action === 'save' ? ' What you typed is still here.' : ''
    return `Couldn't ${verb}: can't reach the internet.${kept} Try again when you're connected.`
  }
  if (kind === 'signedOut') {
    return `Couldn't ${verb}: you've been signed out. Sign in again in a new tab, then try again.`
  }
  return `Couldn't ${verb}. Try again in a minute.`
}

/** The database refusing to remove something other rows still point at. */
export function isInUseError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as ErrorLike).code === '23503'
}

/** Whether the browser thinks it's online. Some browsers can't tell: assume yes. */
export function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}
