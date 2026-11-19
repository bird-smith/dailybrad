import { describe, expect, it } from 'vitest'
import { brewsLikeThis, filterFromParams, filterSummary, filterToParams, recipeOptions } from './historyFilter'
import type { Bean, Method, Recipe } from './types'

const BEAN = '11111111-1111-4111-8111-111111111111'
const METHOD = '22222222-2222-4222-8222-222222222222'
const RECIPE = '33333333-3333-4333-8333-333333333333'

const bean = { id: BEAN, name: 'Ethiopia Guji' } as Bean
const v60 = { id: METHOD, name: 'V60' } as Method
const aero = { id: 'm2', name: 'AeroPress' } as Method
const recipe = (id: string, name: string, method_id: string) => ({ id, name, method_id }) as Recipe

describe('filter in the address', () => {
  it('round-trips', () => {
    const filter = { bean: BEAN, method: METHOD, recipe: RECIPE }
    expect(filterFromParams(filterToParams(filter))).toEqual(filter)
  })
  it('empty filter, empty params', () => {
    expect(filterToParams({}).toString()).toBe('')
    expect(filterFromParams(new URLSearchParams())).toEqual({})
  })
  it('ignores anything that is not an id', () => {
    expect(filterFromParams(new URLSearchParams('bean=hello&method=' + METHOD))).toEqual({ method: METHOD })
  })
})

describe('brewsLikeThis', () => {
  it('takes all three ids', () => {
    expect(brewsLikeThis({ bean_id: BEAN, method_id: METHOD, recipe_id: RECIPE })).toEqual({
      bean: BEAN,
      method: METHOD,
      recipe: RECIPE,
    })
  })
  it('leaves out a deleted recipe', () => {
    expect(brewsLikeThis({ bean_id: BEAN, method_id: METHOD, recipe_id: null })).toEqual({ bean: BEAN, method: METHOD })
  })
})

describe('filterSummary', () => {
  const recipes = [recipe(RECIPE, 'Kasuya', METHOD)]
  it('names all three', () => {
    expect(filterSummary({ bean: BEAN, method: METHOD, recipe: RECIPE }, [bean], [v60], recipes)).toBe(
      'Ethiopia Guji · V60 · Kasuya',
    )
  })
  it('only what is chosen', () => {
    expect(filterSummary({ method: METHOD }, [bean], [v60], recipes)).toBe('V60')
  })
  it('skips an id not in the lists', () => {
    expect(filterSummary({ bean: 'gone', method: METHOD }, [bean], [v60], recipes)).toBe('V60')
  })
})

describe('recipeOptions', () => {
  it('groups by method, then name', () => {
    const recipes = [recipe('r1', 'Kasuya', METHOD), recipe('r2', 'Hoffmann', 'm2'), recipe('r3', 'Daily', METHOD)]
    expect(recipeOptions(recipes, [v60, aero])).toEqual([
      { id: 'r2', label: 'Hoffmann · AeroPress' },
      { id: 'r3', label: 'Daily · V60' },
      { id: 'r1', label: 'Kasuya · V60' },
    ])
  })
})
