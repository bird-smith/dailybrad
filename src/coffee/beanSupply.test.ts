import { describe, expect, it } from 'vitest'
import { costPerCupCents, cupsLeft, cupsText, doseFor, supplyLine, toTenths } from './beanSupply'
import type { Bean, BeanSupply } from './types'

const bean = (over: Partial<Bean> = {}): Bean => ({
  id: 'b1',
  name: 'Test',
  roaster: null,
  roast_date: null,
  bag_grams: 340,
  cost_cents: 2200,
  region: null,
  process: null,
  varietal: null,
  notes: null,
  finished: false,
  is_active: false,
  created_at: '2026-11-01T00:00:00Z',
  ...over,
})

const tenBrews: BeanSupply[] = [{ bean_id: 'b1', used_tenths: 1800, last_dose_tenths: 180 }]

describe('toTenths', () => {
  it('turns grams into whole tenths', () => {
    expect(toTenths(18.1)).toBe(181)
    expect(toTenths(18)).toBe(180)
    expect(toTenths(18.5)).toBe(185)
  })
})

describe('cupsLeft', () => {
  it('works out the worked example', () => expect(cupsLeft(340, 1800, 180)).toBe(8))
  it('keeps 18.1 g doses exact', () => expect(cupsLeft(340, 1810, 181)).toBe(8))
  it('counts a fresh bag', () => expect(cupsLeft(340, 0, 180)).toBe(18))
  it('gives 0 when less than a dose is left', () => expect(cupsLeft(20, 180, 180)).toBe(0))
  it('counts exactly one dose left', () => expect(cupsLeft(36, 180, 180)).toBe(1))
  it('never goes negative', () => expect(cupsLeft(20, 900, 180)).toBe(0))
})

describe('costPerCupCents', () => {
  it('works out the worked example', () => expect(costPerCupCents(2200, 340, 180)).toBe(116))
  it('gives 0 for a free bag', () => expect(costPerCupCents(0, 340, 180)).toBe(0))
  it('rounds half a cent up', () => expect(costPerCupCents(2250, 1000, 180)).toBe(41))
})

describe('cupsText', () => {
  it('has three wordings', () => {
    expect(cupsText(0)).toBe('Less than a cup left')
    expect(cupsText(1)).toBe('About 1 cup left')
    expect(cupsText(8)).toBe('About 8 cups left')
  })
})

describe('doseFor', () => {
  it("prefers the bag's own last dose", () => expect(doseFor('b1', tenBrews, 200)).toBe(180))
  it('falls back to the latest of any bag', () => expect(doseFor('b2', tenBrews, 200)).toBe(200))
  it('gives null with neither', () => expect(doseFor('b2', tenBrews, null)).toBeNull())
})

describe('supplyLine', () => {
  it('works out the worked example', () =>
    expect(supplyLine(bean(), tenBrews, 180)).toBe('About 8 cups left · $1.16 a cup'))
  it('uses the latest dose of any bag for a new bag', () =>
    expect(supplyLine(bean(), [], 180)).toBe('About 18 cups left · $1.16 a cup'))
  it('leaves out the cost when none is given', () =>
    expect(supplyLine(bean({ cost_cents: null }), tenBrews, 180)).toBe('About 8 cups left'))
  it('shows a free bag as $0.00', () =>
    expect(supplyLine(bean({ cost_cents: 0 }), tenBrews, 180)).toBe('About 8 cups left · $0.00 a cup'))
  it('gives null with no bag size', () => expect(supplyLine(bean({ bag_grams: null }), tenBrews, 180)).toBeNull())
  it('gives null for a finished bag', () => expect(supplyLine(bean({ finished: true }), tenBrews, 180)).toBeNull())
  it('shows grams left with no dose anywhere', () => expect(supplyLine(bean(), [], null)).toBe('340 g left'))
  it('says less than a cup when more was logged than the bag held', () =>
    expect(supplyLine(bean(), [{ bean_id: 'b1', used_tenths: 5000, last_dose_tenths: 180 }], 180)).toBe(
      'Less than a cup left · $1.16 a cup',
    ))
})
