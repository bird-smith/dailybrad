import { describe, expect, it } from 'vitest'
import { daysSinceRoast, roastAgeLabel } from './roastAge'

describe('daysSinceRoast', () => {
  it('counts calendar days', () => {
    expect(daysSinceRoast('2026-11-18', new Date(2026, 10, 18, 23, 30))).toBe(0)
    expect(daysSinceRoast('2026-11-17', new Date(2026, 10, 18, 0, 5))).toBe(1)
    expect(daysSinceRoast('2026-11-09', new Date(2026, 10, 18, 12))).toBe(9)
  })
  it('stays exact across a month end and clock changes', () => {
    expect(daysSinceRoast('2026-10-28', new Date(2026, 10, 3, 8))).toBe(6)
    expect(daysSinceRoast('2026-03-27', new Date(2026, 2, 30, 8))).toBe(3)
    expect(daysSinceRoast('2026-10-23', new Date(2026, 9, 27, 8))).toBe(4)
  })
  it('gives nothing without a roast date', () => {
    expect(daysSinceRoast(null, new Date())).toBeNull()
  })
})

describe('roastAgeLabel', () => {
  it('says it plainly', () => {
    expect(roastAgeLabel(0)).toBe('Roasted today')
    expect(roastAgeLabel(1)).toBe('Roasted yesterday')
    expect(roastAgeLabel(9)).toBe('Roasted 9 days ago')
    expect(roastAgeLabel(null)).toBeNull()
  })
})
