import { describe, expect, it } from 'vitest'
import { brewRows } from './brewSetup'
import {
  averageOf,
  rankRecipes,
  ratingLine,
  recommendedId,
  repeatChoice,
  repeatSummary,
  startingDraft,
} from './recommendations'
import type { Brew, Recipe, RecipeRating, RecipeStep } from './types'

function recipe(id: string, name: string, changes: Partial<Recipe> = {}): Recipe {
  return {
    id,
    method_id: 'v60',
    name,
    ratio: 15,
    dose_grams: 15,
    grinder: 'Comandante',
    grind_size: '25 clicks',
    temperature: 93,
    bloom_seconds: 45,
    total_seconds: 210,
    steps: [{ kind: 'pour', percent: 100, at: null }],
    notes: null,
    created_at: '2026-11-01T00:00:00Z',
    ...changes,
  }
}

const pour = (percent: number): RecipeStep => ({ kind: 'pour', percent, at: null })

function brew(changes: Partial<Brew> = {}): Brew {
  return {
    id: 'brew1',
    brewed_at: new Date(2026, 10, 17, 7, 42).toISOString(),
    bean_id: 'X',
    method_id: 'v60',
    recipe_id: 'A',
    recipe_name: 'A',
    dose_grams: 18.5,
    ratio: 16,
    grinder: 'Comandante',
    grind_size: '22 clicks',
    temperature: 94,
    bloom_seconds: 40,
    brew_seconds: 200,
    steps: [pour(10), pour(40), pour(50)],
    rating: 4,
    taste_words: [],
    rating_note: null,
    ...changes,
  }
}

const rating = (id: string, count: number, total: number, beanCount = 0, beanTotal = 0): RecipeRating => ({
  recipe_id: id,
  rated_brews: count,
  rating_total: total,
  bean_rated_brews: beanCount,
  bean_rating_total: beanTotal,
})

// Worked example: V60 recipes A to D. A rated 5 (X), 4 (Y), 4 (X); B rated 5 once (X);
// C has one unrated brew (so no rating row); D none. Bag X chosen.
const A = recipe('A', 'A')
const B = recipe('B', 'B')
const C = recipe('C', 'C')
const D = recipe('D', 'D')
const RECIPES = [D, C, B, A]
const RATINGS_X = [rating('A', 3, 13, 2, 9), rating('B', 1, 5, 1, 5)]

describe('averageOf', () => {
  it('divides, or gives null with nothing to divide', () => {
    expect(averageOf(13, 3)).toBeCloseTo(4.3333, 4)
    expect(averageOf(0, 0)).toBeNull()
  })
})

describe('rankRecipes', () => {
  it('ranks the worked example B, A, then C, D', () => {
    const rows = rankRecipes(RECIPES, RATINGS_X)
    expect(rows.map((r) => r.recipe.id)).toEqual(['B', 'A', 'C', 'D'])
    expect(rows.map(ratingLine)).toEqual(['5 from 1 brew', '4.3 from 3 brews', 'No ratings yet', 'No ratings yet'])
  })

  it('shows the bag average only from 3 rated brews with that bag', () => {
    expect(ratingLine(rankRecipes([A], [rating('A', 3, 13, 2, 9)])[0])).toBe('4.3 from 3 brews')
    expect(ratingLine(rankRecipes([A], [rating('A', 4, 18, 3, 14)])[0])).toBe(
      '4.5 from 4 brews · this bag 4.7 from 3',
    )
  })

  it('breaks ties by more rated brews, then by name', () => {
    const P = recipe('P', 'Pear')
    const Q = recipe('Q', 'Quince')
    const R = recipe('R', 'Apple')
    const rows = rankRecipes([P, Q, R], [rating('P', 2, 9), rating('Q', 4, 18), rating('R', 2, 9)])
    expect(rows.map((r) => r.recipe.id)).toEqual(['Q', 'R', 'P'])
  })

  it('ranks by the exact average, not the rounded one', () => {
    const P = recipe('P', 'A first by name')
    const Q = recipe('Q', 'Z last by name')
    const rows = rankRecipes([P, Q], [rating('P', 100, 425), rating('Q', 100, 426)])
    expect(rows.map((r) => r.recipe.id)).toEqual(['Q', 'P'])
    expect(rows.map(ratingLine)).toEqual(['4.3 from 100 brews', '4.3 from 100 brews'])
  })

  it('ignores ratings for recipes not in this method', () => {
    const rows = rankRecipes([A], [rating('elsewhere', 1, 5), rating('A', 1, 3)])
    expect(rows).toHaveLength(1)
    expect(ratingLine(rows[0])).toBe('3 from 1 brew')
  })

  it('lists unrated recipes A to Z', () => {
    expect(rankRecipes([D, C, A], []).map((r) => r.recipe.id)).toEqual(['A', 'C', 'D'])
  })
})

describe('recommendedId', () => {
  it('is the top recipe when it is rated', () => {
    expect(recommendedId(rankRecipes(RECIPES, RATINGS_X))).toBe('B')
    expect(recommendedId(rankRecipes(RECIPES, []))).toBeNull()
    expect(recommendedId([])).toBeNull()
  })
})

describe('ratingLine', () => {
  it('shows whole averages without a decimal and rounds to one', () => {
    expect(ratingLine(rankRecipes([A], [rating('A', 2, 8)])[0])).toBe('4 from 2 brews')
    expect(ratingLine(rankRecipes([A], [rating('A', 4, 17)])[0])).toBe('4.3 from 4 brews')
    expect(ratingLine(rankRecipes([A], [rating('A', 1, 4)])[0])).toBe('4 from 1 brew')
  })
})

describe('repeatChoice', () => {
  it('gives the brew only when its recipe is in this method', () => {
    const b = brew()
    expect(repeatChoice(b, RECIPES)).toBe(b)
    expect(repeatChoice(brew({ recipe_id: 'moved' }), RECIPES)).toBeNull()
    expect(repeatChoice(null, RECIPES)).toBeNull()
  })
})

describe('repeatSummary', () => {
  const now = new Date(2026, 10, 18, 9, 0)
  it('says dose, grind and when', () => {
    expect(repeatSummary(brew(), now)).toBe('18.5 g · 22 clicks · Yesterday · 7:42 AM')
  })
  it('leaves a blank grind out', () => {
    expect(repeatSummary(brew({ grind_size: null }), now)).toBe('18.5 g · Yesterday · 7:42 AM')
    expect(repeatSummary(brew({ grind_size: '' }), now)).toBe('18.5 g · Yesterday · 7:42 AM')
  })
})

describe('startingDraft', () => {
  it('starts from the recipe with no brew, or a brew of another recipe', () => {
    const plain = startingDraft(A, 'Y', null)
    expect(plain.repeating).toBe(false)
    expect(plain.draft).toMatchObject({ dose: 15, beanId: 'Y', recipeId: 'A', totalSeconds: 210 })
    const other = startingDraft(B, 'Y', brew())
    expect(other.repeating).toBe(false)
    expect(other.draft.dose).toBe(15)
  })

  it('copies the brew, with the chosen bag and the recipe target time', () => {
    const { draft, repeating } = startingDraft(A, 'Y', brew())
    expect(repeating).toBe(true)
    expect(draft).toEqual({
      methodId: 'v60',
      beanId: 'Y',
      recipeId: 'A',
      dose: 18.5,
      ratio: 16,
      grinder: 'Comandante',
      grindSize: '22 clicks',
      temperature: 94,
      bloomSeconds: 40,
      totalSeconds: 210,
      steps: [pour(10), pour(40), pour(50)],
    })
    const { water, rows } = brewRows(draft)
    expect(water).toBe(296)
    expect(rows.map((r) => (r.kind === 'pour' ? r.pourTo : null))).toEqual([30, 148, 296])
  })

  it('copies the steps, leaving the brew alone', () => {
    const b = brew()
    const { draft } = startingDraft(A, 'Y', b)
    draft.steps.push(pour(5))
    expect(b.steps).toHaveLength(3)
  })
})
