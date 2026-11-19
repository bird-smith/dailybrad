import { describe, expect, it } from 'vitest'
import {
  brewDayLabel,
  brewToFixForm,
  brewToSave,
  checkBrewFix,
  draftFromBrew,
  historyRows,
  roastAgeOnBrewDay,
} from './brewLog'
import { brewRows, draftFromRecipe } from './brewSetup'
import type { Bean, Brew, Method, Recipe, RecipeStep } from './types'

const pour = (percent: number): RecipeStep => ({ kind: 'pour', percent, at: null })
const STEPS = [pour(10), pour(40), pour(50)]

const recipe: Recipe = {
  id: 'r1',
  method_id: 'm1',
  name: 'Kasuya',
  ratio: 15,
  dose_grams: 18,
  grinder: 'Comandante',
  grind_size: '18 clicks',
  temperature: 93,
  bloom_seconds: 45,
  total_seconds: 180,
  steps: STEPS,
  notes: null,
  created_at: '',
}

function brew(changes: Partial<Brew> = {}): Brew {
  return {
    id: 'b1',
    brewed_at: new Date(2026, 10, 18, 7, 42).toISOString(),
    bean_id: 'bean1',
    method_id: 'm1',
    recipe_id: 'r1',
    recipe_name: 'Kasuya',
    dose_grams: 18,
    ratio: 15,
    grinder: null,
    grind_size: null,
    temperature: null,
    bloom_seconds: null,
    brew_seconds: null,
    steps: STEPS,
    rating: null,
    taste_words: [],
    rating_note: null,
    ...changes,
  }
}

describe('brewToSave', () => {
  it('copies every setting from the draft', () => {
    const draft = draftFromRecipe(recipe, 'bean1')
    const result = brewToSave(draft, 'Kasuya', '310')
    expect(result).toEqual({
      ok: true,
      values: {
        bean_id: 'bean1',
        method_id: 'm1',
        recipe_id: 'r1',
        recipe_name: 'Kasuya',
        dose_grams: 18,
        ratio: 15,
        grinder: 'Comandante',
        grind_size: '18 clicks',
        temperature: 93,
        bloom_seconds: 45,
        brew_seconds: 190,
        steps: STEPS,
      },
    })
    if (!result.ok) return
    draft.steps.push(pour(1))
    expect(result.values.steps).toHaveLength(3)
    expect('user_id' in result.values || 'brewed_at' in result.values).toBe(false)
  })
  it('reads the brew time', () => {
    const draft = draftFromRecipe(recipe, 'bean1')
    expect(brewToSave(draft, 'K', '  ').ok && brewToSave(draft, 'K', '').ok).toBe(true)
    const blank = brewToSave(draft, 'K', '')
    expect(blank.ok && blank.values.brew_seconds).toBeNull()
    expect(brewToSave(draft, 'K', '9:99').ok).toBe(false)
  })
  it('copies, never points at the recipe', () => {
    const r: Recipe = { ...recipe, steps: [...STEPS] }
    const result = brewToSave(draftFromRecipe(r, 'bean1'), r.name, '')
    r.ratio = 17
    r.steps.push(pour(5))
    expect(result.ok && [result.values.ratio, result.values.steps.length]).toEqual([15, 3])
  })
})

describe('draftFromBrew', () => {
  it('scales with the 1.4 rule', () => {
    expect(brewRows(draftFromBrew(brew())).rows.map((r) => r.kind === 'pour' && r.pourTo)).toEqual([27, 135, 270])
    const at20 = brewRows(draftFromBrew(brew({ dose_grams: 20 })))
    expect(at20.water).toBe(300)
    expect(at20.rows.map((r) => r.kind === 'pour' && r.pourTo)).toEqual([30, 150, 300])
  })
})

describe('checkBrewFix', () => {
  const form = brewToFixForm(brew())
  it('accepts a good fix', () => {
    expect(checkBrewFix({ ...form, dose: '18.5', brewTime: '310' })).toEqual({
      ok: true,
      changes: {
        bean_id: 'bean1',
        dose_grams: 18.5,
        ratio: 15,
        grinder: null,
        grind_size: null,
        temperature: null,
        bloom_seconds: null,
        brew_seconds: 190,
      },
    })
  })
  it('refuses bad boxes', () => {
    for (const dose of ['18.55', '']) {
      const result = checkBrewFix({ ...form, dose })
      expect(!result.ok && result.errors.dose).toBeTruthy()
    }
    const noBag = checkBrewFix({ ...form, beanId: '' })
    expect(!noBag.ok && noBag.errors.beanId).toBeTruthy()
    const badTime = checkBrewFix({ ...form, brewTime: '9:99' })
    expect(!badTime.ok && badTime.errors.brewTime).toBeTruthy()
  })
})

describe('brewDayLabel', () => {
  const now = new Date(2026, 10, 18, 9, 0)
  const at = (...args: [number, number, number, number, number]) => new Date(...args).toISOString()
  it('says when, plainly', () => {
    expect(brewDayLabel(at(2026, 10, 18, 7, 42), now)).toBe('Today · 7:42 AM')
    expect(brewDayLabel(at(2026, 10, 17, 23, 50), now)).toBe('Yesterday · 11:50 PM')
    expect(brewDayLabel(at(2026, 10, 16, 7, 42), now)).toBe('Mon, Nov 16 · 7:42 AM')
    expect(brewDayLabel(at(2025, 10, 16, 7, 42), now)).toBe('Nov 16, 2025 · 7:42 AM')
  })
})

describe('roastAgeOnBrewDay', () => {
  const brewed = new Date(2026, 10, 16, 8, 0).toISOString()
  it('counts from roast to brew day', () => {
    expect(roastAgeOnBrewDay('2026-11-07', brewed)).toBe('9 days after roast')
    expect(roastAgeOnBrewDay('2026-11-16', brewed)).toBe('Roast day')
    expect(roastAgeOnBrewDay('2026-11-15', brewed)).toBe('1 day after roast')
    expect(roastAgeOnBrewDay(null, brewed)).toBeNull()
    expect(roastAgeOnBrewDay('2026-11-17', brewed)).toBeNull()
  })
})

describe('historyRows', () => {
  const beans = [{ id: 'bean1', name: 'Guji' } as Bean]
  const methods: Method[] = [{ id: 'm1', name: 'V60', created_at: '' }]
  it('joins names, keeping order', () => {
    const rows = historyRows(
      [brew({ id: 'new' }), brew({ id: 'gone', recipe_id: null, recipe_name: 'Old one' })],
      beans,
      methods,
      [{ ...recipe, name: 'Kasuya renamed' }],
      new Date(2026, 10, 18, 9),
    )
    expect(rows.map((r) => [r.brew.id, r.recipeName, r.beanName, r.methodName])).toEqual([
      ['new', 'Kasuya renamed', 'Guji', 'V60'],
      ['gone', 'Old one', 'Guji', 'V60'],
    ])
    expect(rows[0].dayLabel).toBe('Today · 7:42 AM')
  })
})
