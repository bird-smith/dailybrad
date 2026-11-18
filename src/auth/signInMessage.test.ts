import { describe, expect, it } from 'vitest'
import { signInMessage, SIGN_IN_MESSAGES } from './signInMessage'

describe('signInMessage', () => {
  it('explains wrong email or password', () => {
    expect(
      signInMessage({ message: 'Invalid login credentials', status: 400, code: 'invalid_credentials' }),
    ).toBe(SIGN_IN_MESSAGES.wrongLogin)
    expect(signInMessage({ message: 'Invalid login credentials', status: 400 })).toBe(
      SIGN_IN_MESSAGES.wrongLogin,
    )
  })

  it('explains a network failure', () => {
    expect(signInMessage({ name: 'AuthRetryableFetchError', message: 'Failed to fetch', status: 0 })).toBe(
      SIGN_IN_MESSAGES.offline,
    )
    expect(signInMessage(new TypeError('Failed to fetch'))).toBe(SIGN_IN_MESSAGES.offline)
    expect(signInMessage({ message: 'something' })).toBe(SIGN_IN_MESSAGES.offline)
  })

  it('explains too many tries', () => {
    expect(signInMessage({ message: 'Request rate limit reached', status: 429 })).toBe(
      'Too many tries. Wait a minute, then try again.',
    )
  })

  it('falls back to a general sentence, never the raw text', () => {
    const message = signInMessage({ message: 'pg_internal: weird 500 thing', status: 500 })
    expect(message).toBe('Something went wrong signing in. Try again in a minute.')
    expect(message).not.toContain('pg_internal')
    expect(signInMessage(undefined)).toBe(SIGN_IN_MESSAGES.general)
  })
})
