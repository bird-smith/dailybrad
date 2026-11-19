import { describe, expect, it } from 'vitest'
import { formatOneDecimal, groupRecipes, recipeSummary } from './recipeList'
import type { Method, Recipe, RecipeStep } from './types'

const method = (id: string): Method => ({ id, name: id, created_at: '' })

function recipe(name: string, changes: Partial<Recipe> = {}): Recipe {
  return {
    id: name,
    method_id: 'V60',
    name,
    ratio: 15,
    dose_grams: 18,
    grinder: null,
    grind_size: null,
    temperature: null,
    bloom_seconds: null,
    total_seconds: null,
    steps: [],
    notes: null,
    created_at: '',
    ...changes,
  }
}

const pour = (percent: number): RecipeStep => ({ kind: 'pour', percent, at: null })

describe('groupRecipes', () => {
  it('keeps method order, sorts recipes A to Z, lists empty methods', () => {
    const groups = groupRecipes(
      [method('V60'), method('Switch'), method('Robot')],
      [recipe('kasuya'), recipe('Hoffmann'), recipe('Daily', { method_id: 'Switch' })],
    )
    expect(groups.map((g) => [g.method.name, g.recipes.map((r) => r.name)])).toEqual([
      ['V60', ['Hoffmann', 'kasuya']],
      ['Switch', ['Daily']],
      ['Robot', []],
    ])
  })
})

describe('recipeSummary', () => {
  it('sums up the numbers', () => {
    expect(recipeSummary(recipe('a', { steps: [pour(10), pour(40), pour(50)] }))).toBe('1:15 · 18 g · 3 pours')
    expect(
      recipeSummary(
        recipe('b', { ratio: 16.5, dose_grams: 15.5, steps: [pour(100), { kind: 'action', text: 'Stir', at: null }] }),
      ),
    ).toBe('1:16.5 · 15.5 g · 1 pour')
    expect(recipeSummary(recipe('c', { ratio: 2 }))).toBe('1:2 · 18 g')
  })
})

describe('formatOneDecimal', () => {
  it('drops a trailing .0', () => {
    expect(formatOneDecimal(15)).toBe('15')
    expect(formatOneDecimal(15.5)).toBe('15.5')
    expect(formatOneDecimal(18.0)).toBe('18')
  })
})
