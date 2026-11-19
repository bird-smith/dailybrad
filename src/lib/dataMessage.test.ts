import { describe, expect, it } from 'vitest'
import { dataMessage, isInUseError } from './dataMessage'

describe('isInUseError', () => {
  it('spots the database refusing to remove something in use', () => {
    expect(isInUseError({ status: 409, code: '23503' })).toBe(true)
    expect(isInUseError({ status: 409, code: '23505' })).toBe(false)
    expect(isInUseError({ message: 'Failed to fetch' })).toBe(false)
    expect(isInUseError(null)).toBe(false)
  })
})

const CANT_REACH_SAVE =
  "Couldn't save: can't reach the internet. What you typed is still here. Try again when you're connected."
const SIGNED_OUT_SAVE = "Couldn't save: you've been signed out. Sign in again in a new tab, then try again."
const GENERAL_SAVE = "Couldn't save. Try again in a minute."

describe('dataMessage', () => {
  it("says can't reach for network failures and sleeping databases", () => {
    expect(dataMessage({ message: 'TypeError: Failed to fetch', code: '' }, 'save', true)).toBe(CANT_REACH_SAVE)
    expect(dataMessage({ status: 0 }, 'save', true)).toBe(CANT_REACH_SAVE)
    expect(dataMessage({ status: 503, code: 'X' }, 'save', true)).toBe(CANT_REACH_SAVE)
    expect(dataMessage({ status: 400, code: '23514' }, 'save', false)).toBe(CANT_REACH_SAVE)
  })
  it('says signed out', () => {
    expect(dataMessage({ status: 401 }, 'save', true)).toBe(SIGNED_OUT_SAVE)
    expect(dataMessage({ status: 400, code: 'PGRST301' }, 'save', true)).toBe(SIGNED_OUT_SAVE)
    expect(dataMessage({ status: 403, code: '42501' }, 'save', true)).toBe(SIGNED_OUT_SAVE)
  })
  it('says the general sentence otherwise, never the raw text', () => {
    const message = dataMessage({ status: 400, code: '23514', message: 'violates check' }, 'save', true)
    expect(message).toBe(GENERAL_SAVE)
    expect(dataMessage('weird', 'save', true)).toBe(GENERAL_SAVE)
  })
  it('words load and delete differently', () => {
    expect(dataMessage({ status: 0 }, 'load', true, 'your beans')).toBe(
      "Can't load your beans right now. Check your connection.",
    )
    expect(dataMessage({ status: 400, code: 'X' }, 'load', true, 'your beans')).toBe(
      "Can't load your beans right now.",
    )
    expect(dataMessage({ status: 401 }, 'load', true, 'your beans')).toBe(
      "Can't load your beans: you've been signed out. Sign in again in a new tab.",
    )
    expect(dataMessage({ status: 0 }, 'delete', true)).toBe(
      "Couldn't delete: can't reach the internet. Try again when you're connected.",
    )
    expect(dataMessage({ status: 400, code: 'X' }, 'delete', true)).toBe("Couldn't delete. Try again in a minute.")
  })
})

describe('dataMessage for backups', () => {
  it('words export failures', () => {
    expect(dataMessage({ status: 0 }, 'export', true)).toBe(
      "Couldn't export: can't reach the internet. Try again when you're connected.",
    )
    expect(dataMessage({ status: 401 }, 'export', true)).toBe(
      "Couldn't export: you've been signed out. Sign in again in a new tab, then try again.",
    )
    expect(dataMessage({ status: 400, code: 'X' }, 'export', true)).toBe("Couldn't export. Try again in a minute.")
  })
  it('words import failures', () => {
    expect(dataMessage({ status: 0 }, 'import', true)).toBe("Couldn't finish: can't reach the internet.")
    expect(dataMessage({ status: 401 }, 'import', true)).toBe(
      "Couldn't finish: you've been signed out. Sign in again in a new tab.",
    )
    expect(dataMessage({ status: 400, code: 'X' }, 'import', true)).toBe("Couldn't finish. Try again in a minute.")
  })
  it('says the database refused part of the backup', () => {
    const refused =
      'The database refused part of this backup, so it stopped there. Choose the same file again; if this keeps happening, the file may have been changed by hand.'
    for (const code of ['23502', '23503', '23505', '23514']) {
      expect(dataMessage({ status: 409, code }, 'import', true)).toBe(refused)
    }
  })
})
