import { describe, expect, it } from 'vitest'
import { formatClock, parseClock } from './clock'

describe('parseClock', () => {
  it('reads microwave-style and colon times', () => {
    expect(parseClock('45')).toEqual({ ok: true, seconds: 45 })
    expect(parseClock('045')).toEqual({ ok: true, seconds: 45 })
    expect(parseClock('300')).toEqual({ ok: true, seconds: 180 })
    expect(parseClock('3:00')).toEqual({ ok: true, seconds: 180 })
    expect(parseClock('0:45')).toEqual({ ok: true, seconds: 45 })
    expect(parseClock(' 130 ')).toEqual({ ok: true, seconds: 90 })
  })
  it('treats blank as not given', () => {
    expect(parseClock('  ')).toEqual({ ok: true, seconds: null })
  })
  it('refuses what is not a time', () => {
    for (const text of ['75', '1:75', 'abc', '-5', '6100']) expect(parseClock(text).ok).toBe(false)
  })
})

describe('formatClock', () => {
  it('writes minutes and seconds', () => {
    expect(formatClock(45)).toBe('0:45')
    expect(formatClock(180)).toBe('3:00')
    expect(formatClock(605)).toBe('10:05')
  })
})
