// Turns a database error into one plain sentence. Shared by every screen that loads or
// saves, in any section. Never shows the raw technical text.

export type DataAction = 'save' | 'load' | 'delete'

type ErrorLike = { status?: unknown; code?: unknown; message?: unknown; name?: unknown }

type Kind = 'cantReach' | 'signedOut' | 'general'

const SIGNED_OUT_CODES = ['PGRST301', 'PGRST303', '42501']
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
  const verb = action === 'save' ? 'save' : 'delete'
  if (kind === 'cantReach') {
    const kept = action === 'save' ? ' What you typed is still here.' : ''
    return `Couldn't ${verb}: can't reach the internet.${kept} Try again when you're connected.`
  }
  if (kind === 'signedOut') {
    return `Couldn't ${verb}: you've been signed out. Sign in again in a new tab, then try again.`
  }
  return `Couldn't ${verb}. Try again in a minute.`
}

/** Whether the browser thinks it's online. Some browsers can't tell: assume yes. */
export function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}
