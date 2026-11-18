// Turns a sign-in error into one plain sentence. Never shows the raw technical text.
export const SIGN_IN_MESSAGES = {
  wrongLogin: "That email or password isn't right.",
  offline: "Can't reach the internet. Check your connection and try again.",
  tooMany: 'Too many tries. Wait a minute, then try again.',
  general: 'Something went wrong signing in. Try again in a minute.',
}

type ErrorLike = { message?: unknown; status?: unknown; code?: unknown; name?: unknown }

export function signInMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) return SIGN_IN_MESSAGES.general
  const { message, status, code, name } = error as ErrorLike

  if (code === 'invalid_credentials' || message === 'Invalid login credentials') {
    return SIGN_IN_MESSAGES.wrongLogin
  }
  if (status === 429 || code === 'over_request_rate_limit') return SIGN_IN_MESSAGES.tooMany
  // A failed fetch (offline, or the free database asleep) arrives with no status, or 0.
  if (name === 'AuthRetryableFetchError' || status === undefined || status === 0) {
    return SIGN_IN_MESSAGES.offline
  }
  return SIGN_IN_MESSAGES.general
}
