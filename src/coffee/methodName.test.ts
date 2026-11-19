import { describe, expect, it } from 'vitest'
import { checkMethodName } from './methodName'

describe('checkMethodName', () => {
  it('trims spaces', () => {
    expect(checkMethodName('  V60 ', [])).toEqual({ ok: true, name: 'V60' })
  })
  it('refuses empty or spaces only', () => {
    expect(checkMethodName('', []).ok).toBe(false)
    expect(checkMethodName('   ', []).ok).toBe(false)
  })
  it('accepts 40 characters, refuses 41', () => {
    expect(checkMethodName('a'.repeat(40), []).ok).toBe(true)
    expect(checkMethodName('a'.repeat(41), []).ok).toBe(false)
  })
  it('refuses a name already there, ignoring capitals', () => {
    expect(checkMethodName('v60', ['V60'])).toEqual({ ok: false, message: 'You already have V60.' })
  })
  it('allows renaming a method to its own name in other capitals', () => {
    expect(checkMethodName('v60', ['V60', 'Switch'], 'V60')).toEqual({ ok: true, name: 'v60' })
  })
})
