import { describe, expect, it } from 'vitest'
import { checkDose, checkRatio, checkRecipe, checkShortText, checkTemperature, EMPTY_RECIPE_FORM, recipeToForm, TEMP_MAX, TEMP_MIN, type FormRow, type RecipeForm } from './recipeForm'
import type { Recipe } from './types'

const BASE: RecipeForm = { ...EMPTY_RECIPE_FORM, methodId: 'm1', name: 'Kasuya 4:6', ratio: '15', dose: '18' }
const form = (changes: Partial<RecipeForm>) => ({ ...BASE, ...changes })
const pourRow = (pourTo: string, at = '', unit: 'g' | '%' = 'g'): FormRow => ({
  key: Math.random().toString(),
  kind: 'pour',
  pourTo,
  unit,
  at,
})
const stepRow = (text: string, at = ''): FormRow => ({ key: Math.random().toString(), kind: 'action', text, at })

function errorsOf(f: RecipeForm, names: string[] = []) {
  const result = checkRecipe(f, names)
  if (result.ok) throw new Error('expected a refusal')
  return result
}

describe('checkRecipe', () => {
  it('accepts method, name, ratio and dose only', () => {
    expect(checkRecipe(BASE, [])).toEqual({
      ok: true,
      values: {
        method_id: 'm1',
        name: 'Kasuya 4:6',
        ratio: 15,
        dose_grams: 18,
        grinder: null,
        grind_size: null,
        temperature: null,
        bloom_seconds: null,
        total_seconds: null,
        steps: [],
        notes: null,
      },
    })
  })
  it('requires each of method, name, ratio and dose', () => {
    expect(errorsOf(form({ methodId: '' })).errors.methodId).toBeTruthy()
    expect(errorsOf(form({ name: ' ' })).errors.name).toBeTruthy()
    expect(errorsOf(form({ ratio: '' })).errors.ratio).toBeTruthy()
    expect(errorsOf(form({ dose: '' })).errors.dose).toBeTruthy()
  })
  it('checks ratio and dose numbers', () => {
    expect(checkRecipe(form({ ratio: '15.5' }), []).ok).toBe(true)
    for (const ratio of ['0', '31', '15.55', 'abc']) expect(errorsOf(form({ ratio })).errors.ratio).toBeTruthy()
    expect(checkRecipe(form({ dose: '18.5' }), []).ok).toBe(true)
    for (const dose of ['0', '101', '18.55', 'abc']) expect(errorsOf(form({ dose })).errors.dose).toBeTruthy()
  })
  it('refuses a name already used in the same method', () => {
    expect(errorsOf(form({ name: 'kasuya 4:6' }), ['Kasuya 4:6']).errors.name).toBe(
      'You already have a recipe called Kasuya 4:6 for this method.',
    )
    expect(checkRecipe(BASE, ['Other']).ok).toBe(true)
  })
  it('checks temperature', () => {
    expect(checkRecipe(form({ temperature: String(TEMP_MIN) }), []).ok).toBe(true)
    expect(checkRecipe(form({ temperature: String(TEMP_MAX) }), []).ok).toBe(true)
    for (const temperature of [String(TEMP_MIN - 1), String(TEMP_MAX + 1), '93.5']) {
      expect(errorsOf(form({ temperature })).errors.temperature).toBeTruthy()
    }
  })
  it('saves pours as typed: fixed grams or %, the last filling to the water', () => {
    const result = checkRecipe(form({ rows: [pourRow('45', '0'), pourRow('100', '45'), pourRow('')] }), [])
    expect(result.ok && result.values.steps).toEqual([
      { kind: 'pour', to: 45, unit: 'g', at: 0 },
      { kind: 'pour', to: 100, unit: 'g', at: 45 },
      { kind: 'pour', to: null, unit: 'g', at: null },
    ])
    const percent = checkRecipe(form({ rows: [pourRow('250', '', '%'), pourRow('60', '', '%'), pourRow('')] }), [])
    expect(percent.ok && percent.values.steps.slice(0, 2)).toEqual([
      { kind: 'pour', to: 250, unit: '%', at: null },
      { kind: 'pour', to: 60, unit: '%', at: null },
    ])
  })
  it('checks % pours: bloom % of dose, later % of water', () => {
    // 18 g dose, 270 g water: 250% of dose is 45 g; 10% of water is 27 g, below the bloom.
    expect(errorsOf(form({ rows: [pourRow('250', '', '%'), pourRow('10', '', '%'), pourRow('')] })).rowErrors[1]).toMatch(
      /more than the one before/,
    )
    expect(errorsOf(form({ rows: [pourRow('45'), pourRow('100', '', '%'), pourRow('')] })).rowErrors[1]).toMatch(/under 100%/)
    expect(errorsOf(form({ rows: [pourRow('0', '', '%'), pourRow('')] })).rowErrors[0]).toMatch(/percentage of the dose/)
  })
  it('refuses pours that go down or reach the water', () => {
    expect(errorsOf(form({ rows: [pourRow('135'), pourRow('135'), pourRow('')] })).rowErrors[1]).toBeTruthy()
    expect(errorsOf(form({ rows: [pourRow('135'), pourRow('100'), pourRow('')] })).rowErrors[1]).toBeTruthy()
    expect(errorsOf(form({ rows: [pourRow('270'), pourRow('')] })).rowErrors[0]).toBeTruthy()
  })
  it('checks step text', () => {
    expect(errorsOf(form({ rows: [stepRow(' ')] })).rowErrors[0]).toBeTruthy()
    expect(errorsOf(form({ rows: [stepRow('a'.repeat(61))] })).rowErrors[0]).toBeTruthy()
  })
  it('refuses times going backwards, allows blanks between', () => {
    expect(errorsOf(form({ rows: [stepRow('Swirl', '45'), stepRow('Stir', '30')] })).rowErrors[1]).toBeTruthy()
    expect(checkRecipe(form({ rows: [stepRow('A', '30'), stepRow('B'), stepRow('C', '45')] }), []).ok).toBe(true)
  })
  it('refuses more than 20 rows', () => {
    const rows = Array.from({ length: 21 }, () => stepRow('Stir'))
    expect(errorsOf(form({ rows })).errors.rows).toBeTruthy()
  })
})

const EMPTY_RECIPE: Recipe = {
  id: 'r1',
  created_at: '',
  method_id: 'm1',
  name: 'Kasuya',
  ratio: 15,
  dose_grams: 18,
  grinder: null,
  grind_size: null,
  temperature: null,
  bloom_seconds: null,
  total_seconds: null,
  steps: [],
  notes: null,
}

describe('recipeToForm', () => {
  it('turns old shares into grams at the recipe dose', () => {
    const recipe: Recipe = {
      ...EMPTY_RECIPE,
      steps: [
        { kind: 'pour', percent: 10, at: 0 },
        { kind: 'pour', percent: 40, at: 45 },
        { kind: 'pour', percent: 50, at: 90 },
      ],
    }
    const back = recipeToForm(recipe)
    expect(back.rows.slice(0, 2)).toMatchObject([{ pourTo: '27', unit: 'g' }, { pourTo: '135', unit: 'g' }])
    const again = checkRecipe(back, [])
    expect(again.ok && again.values.steps[1]).toEqual({ kind: 'pour', to: 135, unit: 'g', at: 45 })
  })
  it('round-trips through checkRecipe', () => {
    const values = {
      method_id: 'm1',
      name: 'Kasuya',
      ratio: 15,
      dose_grams: 18,
      grinder: 'Comandante',
      grind_size: '24 clicks',
      temperature: 93,
      bloom_seconds: 45,
      total_seconds: 210,
      steps: [
        { kind: 'pour' as const, to: 250, unit: '%' as const, at: 0 },
        { kind: 'action' as const, text: 'Close valve', at: null },
        { kind: 'pour' as const, to: 100, unit: 'g' as const, at: 45 },
        { kind: 'pour' as const, to: null, unit: 'g' as const, at: 90 },
      ],
      notes: 'Sweet',
    }
    const recipe: Recipe = { id: 'r1', created_at: '', ...values }
    const back = recipeToForm(recipe)
    expect(back.rows[0]).toMatchObject({ kind: 'pour', pourTo: '250', unit: '%' })
    expect(checkRecipe(back, [])).toEqual({ ok: true, values })
  })
})

describe('single-box checks', () => {
  it('checkDose', () => {
    expect(checkDose('18')).toEqual({ ok: true, value: 18 })
    expect(checkDose('18.5')).toEqual({ ok: true, value: 18.5 })
    for (const text of ['0', '101', '18.55', 'abc', '']) expect(checkDose(text).ok).toBe(false)
  })
  it('checkRatio', () => {
    expect(checkRatio('15')).toEqual({ ok: true, value: 15 })
    expect(checkRatio('15.5')).toEqual({ ok: true, value: 15.5 })
    for (const text of ['0', '31']) expect(checkRatio(text).ok).toBe(false)
  })
  it('checkTemperature', () => {
    expect(checkTemperature(' ')).toEqual({ ok: true, value: null })
    expect(checkTemperature(String(TEMP_MIN)).ok).toBe(true)
    expect(checkTemperature(String(TEMP_MAX)).ok).toBe(true)
    expect(checkTemperature(String(TEMP_MIN - 1)).ok).toBe(false)
    expect(checkTemperature(String(TEMP_MAX + 1)).ok).toBe(false)
  })
  it('checkShortText', () => {
    expect(checkShortText('  ', 30)).toEqual({ ok: true, value: null })
    expect(checkShortText(' 18 clicks ', 30)).toEqual({ ok: true, value: '18 clicks' })
    expect(checkShortText('a'.repeat(31), 30).ok).toBe(false)
  })
})
