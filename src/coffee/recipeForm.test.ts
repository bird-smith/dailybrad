import { describe, expect, it } from 'vitest'
import { checkRecipe, EMPTY_RECIPE_FORM, recipeToForm, TEMP_MAX, TEMP_MIN, type FormRow, type RecipeForm } from './recipeForm'
import type { Recipe } from './types'

const BASE: RecipeForm = { ...EMPTY_RECIPE_FORM, methodId: 'm1', name: 'Kasuya 4:6', ratio: '15', dose: '18' }
const form = (changes: Partial<RecipeForm>) => ({ ...BASE, ...changes })
const pourRow = (pourTo: string, at = ''): FormRow => ({ key: Math.random().toString(), kind: 'pour', pourTo, at })
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
  it('saves pours as shares', () => {
    const result = checkRecipe(form({ rows: [pourRow('27', '0'), pourRow('135', '45'), pourRow('')] }), [])
    expect(result.ok && result.values.steps).toEqual([
      { kind: 'pour', percent: 10, at: 0 },
      { kind: 'pour', percent: 40, at: 45 },
      { kind: 'pour', percent: 50, at: null },
    ])
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

describe('recipeToForm', () => {
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
        { kind: 'pour' as const, percent: 10, at: 0 },
        { kind: 'action' as const, text: 'Close valve', at: null },
        { kind: 'pour' as const, percent: 40, at: 45 },
        { kind: 'pour' as const, percent: 50, at: 90 },
      ],
      notes: 'Sweet',
    }
    const recipe: Recipe = { id: 'r1', created_at: '', ...values }
    const back = recipeToForm(recipe)
    expect(back.rows[0]).toMatchObject({ kind: 'pour', pourTo: '27' })
    expect(checkRecipe(back, [])).toEqual({ ok: true, values })
  })
})
