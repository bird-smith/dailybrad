import { describe, expect, it } from 'vitest'
import { brewChoices, brewRows, changedSettings, draftFromRecipe, settingsSummary, stepDose } from './brewSetup'
import type { Bean, Method, Recipe, RecipeStep } from './types'

const pour = (percent: number, at: number | null = null): RecipeStep => ({ kind: 'pour', percent, at })

function recipe(changes: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    method_id: 'm1',
    name: 'Worked example',
    ratio: 15,
    dose_grams: 18,
    grinder: null,
    grind_size: null,
    temperature: null,
    bloom_seconds: null,
    total_seconds: null,
    steps: [pour(10), pour(40), pour(50)],
    notes: null,
    created_at: '',
    ...changes,
  }
}

function bean(id: string, changes: Partial<Bean> = {}): Bean {
  return {
    id,
    name: id,
    roaster: null,
    roast_date: null,
    bag_grams: null,
    cost_cents: null,
    region: null,
    process: null,
    varietal: null,
    notes: null,
    finished: false,
    is_active: false,
    created_at: '',
    ...changes,
  }
}

const FULL = recipe({ grinder: 'Comandante', grind_size: '18 clicks', temperature: 93, bloom_seconds: 45, total_seconds: 180 })

describe('draftFromRecipe', () => {
  it('copies every setting, with a copy of the steps', () => {
    const r = FULL
    const draft = draftFromRecipe(r, 'b1')
    expect(draft).toEqual({
      methodId: 'm1',
      beanId: 'b1',
      recipeId: 'r1',
      dose: 18,
      ratio: 15,
      grinder: 'Comandante',
      grindSize: '18 clicks',
      temperature: 93,
      bloomSeconds: 45,
      totalSeconds: 180,
      steps: r.steps,
    })
    draft.steps.push(pour(1))
    expect(r.steps).toHaveLength(3)
    expect(draftFromRecipe(recipe(), 'b1').grinder).toBeNull()
  })
})

describe('brewRows', () => {
  it('scales the worked example', () => {
    expect(brewRows(draftFromRecipe(recipe(), 'b1'))).toEqual({
      water: 270,
      rows: [
        { kind: 'pour', pourTo: 27, amount: 27, at: null },
        { kind: 'pour', pourTo: 135, amount: 108, at: null },
        { kind: 'pour', pourTo: 270, amount: 135, at: null },
      ],
      problem: null,
    })
    const at20 = brewRows({ ...draftFromRecipe(recipe(), 'b1'), dose: 20 })
    expect(at20.water).toBe(300)
    expect(at20.rows.map((r) => r.kind === 'pour' && [r.pourTo, r.amount])).toEqual([
      [30, 30],
      [150, 120],
      [300, 150],
    ])
  })
  it('follows a changed ratio', () => {
    const rows = brewRows({ ...draftFromRecipe(recipe(), 'b1'), ratio: 16 })
    expect(rows.water).toBe(288)
    expect(rows.rows[2]).toMatchObject({ pourTo: 288 })
  })
  it('keeps steps in place', () => {
    const steps: RecipeStep[] = [pour(10), pour(40), { kind: 'action', text: 'Open valve', at: 120 }, pour(50, 150)]
    const { rows } = brewRows(draftFromRecipe(recipe({ steps }), 'b1'))
    expect(rows[2]).toEqual({ kind: 'action', text: 'Open valve', at: 120 })
    expect(rows[1]).toMatchObject({ pourTo: 135 })
    expect(rows[3]).toEqual({ kind: 'pour', pourTo: 270, amount: 135, at: 150 })
  })
  it('handles no pours', () => {
    const steps: RecipeStep[] = [{ kind: 'action', text: 'Press', at: null }]
    const result = brewRows(draftFromRecipe(recipe({ ratio: 2, steps }), 'b1'))
    expect(result).toEqual({ water: 36, rows: [{ kind: 'action', text: 'Press', at: null }], problem: null })
  })
  it('keeps fixed pours fixed at another dose, and says so when they no longer fit', () => {
    const steps: RecipeStep[] = [
      { kind: 'pour', to: 45, unit: 'g', at: null },
      { kind: 'pour', to: 100, unit: 'g', at: 45 },
      { kind: 'pour', to: null, unit: 'g', at: null },
    ]
    const at16 = brewRows({ ...draftFromRecipe(recipe({ steps }), 'b1'), dose: 16 })
    expect(at16.water).toBe(240)
    expect(at16.rows.map((r) => r.kind === 'pour' && [r.pourTo, r.amount])).toEqual([
      [45, 45],
      [100, 55],
      [240, 140],
    ])
    expect(at16.problem).toBeNull()
    expect(brewRows({ ...draftFromRecipe(recipe({ steps }), 'b1'), dose: 6 }).problem).toMatch(/90 g/)
  })
  it('rounds awkward water and still adds up', () => {
    const { water, rows } = brewRows(draftFromRecipe(recipe({ dose_grams: 15.5, ratio: 16.5 }), 'b1'))
    expect(water).toBe(256)
    expect(rows[2]).toMatchObject({ pourTo: 256 })
    expect(rows.reduce((sum, r) => sum + (r.kind === 'pour' ? r.amount : 0), 0)).toBe(256)
  })
})

describe('stepDose', () => {
  it('steps by half a gram within 1 to 100', () => {
    expect(stepDose(18, 1)).toBe(18.5)
    expect(stepDose(18, -1)).toBe(17.5)
    expect(stepDose(18.3, 1)).toBe(18.8)
    expect(stepDose(99.8, 1)).toBe(100)
    expect(stepDose(1.2, -1)).toBe(1)
    expect(stepDose(100, 1)).toBe(100)
  })
})

describe('changedSettings', () => {
  it('lists what differs from the recipe', () => {
    const draft = draftFromRecipe(FULL, 'b1')
    expect(changedSettings(draft, FULL)).toEqual({})
    expect(changedSettings({ ...draft, grindSize: '20 clicks', temperature: 90 }, FULL)).toEqual({
      grindSize: '18 clicks',
      temperature: '93 °C',
    })
    const blank = recipe()
    expect(changedSettings({ ...draftFromRecipe(blank, 'b1'), grinder: 'Niche' }, blank)).toEqual({ grinder: 'none' })
  })
})

describe('settingsSummary', () => {
  it('sums up, leaving blanks out', () => {
    expect(settingsSummary(draftFromRecipe(FULL, 'b1'))).toBe('Comandante · 18 clicks · 93 °C · 1:15 · bloom 0:45')
    expect(settingsSummary({ ...draftFromRecipe(FULL, 'b1'), grindSize: null, temperature: null })).toBe(
      'Comandante · 1:15 · bloom 0:45',
    )
    expect(settingsSummary(draftFromRecipe(recipe(), 'b1'))).toBe('1:15')
  })
})

describe('brewChoices', () => {
  const methods: Method[] = [
    { id: 'm1', name: 'V60', created_at: '' },
    { id: 'm2', name: 'Switch', created_at: '' },
  ]
  it('picks defaults and hides finished bags', () => {
    const beans = [bean('a'), bean('b', { is_active: true }), bean('done', { finished: true })]
    const recipes = [recipe({ id: 'z', name: 'Zed' }), recipe({ id: 'y', name: 'alpha' }), recipe({ id: 'x', method_id: 'm2' })]
    const choices = brewChoices(methods, beans, recipes)
    expect(choices.defaultMethodId).toBeNull()
    expect(choices.defaultBeanId).toBe('b')
    expect(choices.bags.map((b) => b.id)).toEqual(['b', 'a'])
    expect(choices.groups[0].recipes.map((r) => r.name)).toEqual(['alpha', 'Zed'])
    expect(brewChoices([methods[0]], beans, []).defaultMethodId).toBe('m1')
  })
  it('has no default bean when none is active', () => {
    expect(brewChoices(methods, [bean('a')], []).defaultBeanId).toBeNull()
  })
})
