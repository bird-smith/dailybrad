import { describe, expect, it } from 'vitest'
import { pourTargets, poursToPercents, totalWater } from './recipeMath'

describe('totalWater', () => {
  it('is dose times ratio', () => {
    expect(totalWater(18, 15)).toBe(270)
    expect(totalWater(20, 15)).toBe(300)
    expect(totalWater(15.5, 16.5)).toBe(255.75)
  })
})

describe('pourTargets', () => {
  it('gives running totals and single amounts', () => {
    expect(pourTargets([10, 40, 50], 270)).toEqual([
      { pourTo: 27, amount: 27 },
      { pourTo: 135, amount: 108 },
      { pourTo: 270, amount: 135 },
    ])
    expect(pourTargets([10, 40, 50], 300)).toEqual([
      { pourTo: 30, amount: 30 },
      { pourTo: 150, amount: 120 },
      { pourTo: 300, amount: 150 },
    ])
  })
  it('always adds up exactly', () => {
    const pours = pourTargets([33.33, 33.33, 33.34], 250)
    expect(pours.reduce((sum, p) => sum + p.amount, 0)).toBe(250)
    expect(pours[2].pourTo).toBe(250)
  })
  it('gives nothing for no pours', () => {
    expect(pourTargets([], 270)).toEqual([])
  })
})

describe('poursToPercents', () => {
  it('turns pour-to weights into shares totalling 100', () => {
    expect(poursToPercents([27, 135], 270)).toEqual([10, 40, 50])
    expect(poursToPercents([], 270)).toEqual([100])
    const shares = poursToPercents([100, 200], 270)
    expect(Math.round(shares.reduce((a, b) => a + b, 0) * 100) / 100).toBe(100)
  })
  it('round-trips with pourTargets', () => {
    const weights = [41, 97, 180]
    const shares = poursToPercents(weights, 255)
    expect(pourTargets(shares, 255).map((p) => p.pourTo)).toEqual([41, 97, 180, 255])
  })
})
