import { describe, expect, it } from 'vitest'
import { percentOf, pourTargets, pourToGrams, poursProblem, totalWater } from './recipeMath'
import type { PourUnit, RecipeStep } from './types'

type Pour = Extract<RecipeStep, { kind: 'pour' }>
const to = (n: number | null, unit: PourUnit = 'g'): Pour => ({ kind: 'pour', to: n, unit, at: null })
const share = (percent: number): Pour => ({ kind: 'pour', percent, at: null })

describe('totalWater', () => {
  it('is dose times ratio', () => {
    expect(totalWater(18, 15)).toBe(270)
    expect(totalWater(20, 15)).toBe(300)
    expect(totalWater(15.5, 16.5)).toBe(255.75)
  })
})

describe('pourToGrams', () => {
  it('keeps grams as typed, whole', () => {
    expect(pourToGrams(45, 'g', 0, 18, 270)).toBe(45)
    expect(pourToGrams(100, 'g', 1, 16, 240)).toBe(100)
  })
  it('takes the bloom % of the dose and later % of the water', () => {
    expect(percentOf(0)).toBe('dose')
    expect(percentOf(1)).toBe('water')
    expect(pourToGrams(250, '%', 0, 18, 270)).toBe(45)
    expect(pourToGrams(60, '%', 1, 18, 270)).toBe(162)
  })
})

describe('pourTargets', () => {
  it('keeps fixed weights when the dose changes (Brad: bloom 45, pour to 100, at 240 g water)', () => {
    expect(pourTargets([to(45), to(100), to(null)], 16, 240)).toEqual([
      { pourTo: 45, amount: 45 },
      { pourTo: 100, amount: 55 },
      { pourTo: 240, amount: 140 },
    ])
  })
  it('scales % pours: bloom from the dose, later pours from the water', () => {
    expect(pourTargets([to(250, '%'), to(50, '%'), to(null)], 20, 300)).toEqual([
      { pourTo: 50, amount: 50 },
      { pourTo: 150, amount: 100 },
      { pourTo: 300, amount: 150 },
    ])
  })
  it('mixes fixed and %', () => {
    expect(pourTargets([to(45), to(60, '%'), to(null)], 18, 270).map((p) => p.pourTo)).toEqual([45, 162, 270])
  })
  it('still reads old shares of the water', () => {
    expect(pourTargets([share(10), share(40), share(50)], 18, 270)).toEqual([
      { pourTo: 27, amount: 27 },
      { pourTo: 135, amount: 108 },
      { pourTo: 270, amount: 135 },
    ])
    const pours = pourTargets([share(33.33), share(33.33), share(33.34)], 18, 250)
    expect(pours.reduce((sum, p) => sum + p.amount, 0)).toBe(250)
  })
  it('gives nothing for no pours, and one pour is all the water', () => {
    expect(pourTargets([], 18, 270)).toEqual([])
    expect(pourTargets([to(null)], 18, 270)).toEqual([{ pourTo: 270, amount: 270 }])
  })
})

describe('poursProblem', () => {
  it('is null when the pours fit', () => {
    expect(poursProblem(pourTargets([to(45), to(100), to(null)], 16, 240), 240)).toBeNull()
  })
  it('speaks up when fixed pours reach past the water', () => {
    expect(poursProblem(pourTargets([to(45), to(250), to(null)], 16, 240), 240)).toMatch(/don't fit in 240 g/)
  })
})
