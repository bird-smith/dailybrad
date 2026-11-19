import { describe, expect, it } from 'vitest'
import { beanToForm, checkBean, displayMoney, EMPTY_BEAN_FORM, formatMoney, parseMoney } from './beanForm'
import type { Bean } from './types'

const TODAY = '2026-11-18'

describe('parseMoney', () => {
  it('reads prices into cents', () => {
    expect(parseMoney('22')).toEqual({ ok: true, cents: 2200 })
    expect(parseMoney('22.5')).toEqual({ ok: true, cents: 2250 })
    expect(parseMoney('$22.50')).toEqual({ ok: true, cents: 2250 })
    expect(parseMoney(' 7 ')).toEqual({ ok: true, cents: 700 })
  })
  it('treats blank as no cost', () => {
    expect(parseMoney('  ')).toEqual({ ok: true, cents: null })
  })
  it('refuses what is not a price', () => {
    for (const text of ['abc', '22.555', '-3']) expect(parseMoney(text).ok).toBe(false)
  })
})

describe('formatMoney', () => {
  it('writes cents as a price', () => {
    expect(formatMoney(2250)).toBe('22.50')
    expect(formatMoney(700)).toBe('7.00')
    expect(formatMoney(0)).toBe('0.00')
    expect(displayMoney(2250)).toBe('$22.50')
  })
})

describe('checkBean', () => {
  const form = (changes: Partial<typeof EMPTY_BEAN_FORM>) => ({ ...EMPTY_BEAN_FORM, ...changes })

  it('accepts a name only, everything else not given', () => {
    expect(checkBean(form({ name: ' Ethiopia ' }), TODAY)).toEqual({
      ok: true,
      values: {
        name: 'Ethiopia',
        roaster: null,
        roast_date: null,
        bag_grams: null,
        cost_cents: null,
        region: null,
        varietal: null,
        notes: null,
      },
    })
  })
  it('refuses a blank name', () => {
    const result = checkBean(form({ name: '  ' }), TODAY)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.name).toBeTruthy()
  })
  it('checks bag size', () => {
    expect(checkBean(form({ name: 'A', bagGrams: '340' }), TODAY).ok).toBe(true)
    for (const bagGrams of ['0', '340.5', '6000']) {
      const result = checkBean(form({ name: 'A', bagGrams }), TODAY)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.errors.bagGrams).toBeTruthy()
    }
  })
  it('refuses a cost over $1000', () => {
    expect(checkBean(form({ name: 'A', cost: '1000' }), TODAY).ok).toBe(true)
    const result = checkBean(form({ name: 'A', cost: '1000.01' }), TODAY)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.cost).toBeTruthy()
  })
  it("refuses tomorrow's roast date, accepts today's", () => {
    expect(checkBean(form({ name: 'A', roastDate: TODAY }), TODAY).ok).toBe(true)
    const result = checkBean(form({ name: 'A', roastDate: '2026-11-19' }), TODAY)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.roastDate).toBeTruthy()
  })
  it('refuses text that is too long', () => {
    expect(checkBean(form({ name: 'a'.repeat(101) }), TODAY).ok).toBe(false)
    expect(checkBean(form({ name: 'A', notes: 'a'.repeat(2001) }), TODAY).ok).toBe(false)
    expect(checkBean(form({ name: 'A', notes: 'a'.repeat(2000) }), TODAY).ok).toBe(true)
  })
})

describe('beanToForm', () => {
  it('round-trips through checkBean', () => {
    const values = {
      name: 'Kenya AA',
      roaster: 'Onyx',
      roast_date: '2026-11-09',
      bag_grams: 340,
      cost_cents: 2250,
      region: 'Nyeri',
      varietal: 'SL28',
      notes: 'Blackcurrant',
    }
    const bean: Bean = { id: 'x', finished: false, is_active: true, created_at: '', ...values }
    expect(checkBean(beanToForm(bean), TODAY)).toEqual({ ok: true, values })
  })
})
