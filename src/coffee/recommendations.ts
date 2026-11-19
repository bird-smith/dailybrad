// What Choose a brew suggests: recipes ranked by his ratings, and a repeat of the last brew.
import { brewDayLabel, draftFromBrew } from './brewLog'
import { draftFromRecipe, type BrewDraft } from './brewSetup'
import { formatOneDecimal } from './recipeList'
import type { Brew, Recipe, RecipeRating } from './types'

/** Rated brews of one bag before that bag's own average shows. */
export const BEAN_AVERAGE_MIN = 3

export function averageOf(total: number, count: number): number | null {
  return count === 0 ? null : total / count
}

export type RankedRecipe = {
  recipe: Recipe
  average: number | null
  count: number
  /** Only when the chosen bag has BEAN_AVERAGE_MIN or more rated brews with this recipe. */
  beanAverage: number | null
  beanCount: number
}

const byName = (a: RankedRecipe, b: RankedRecipe) => a.recipe.name.localeCompare(b.recipe.name)

/** Rated first by plain average (ties: more brews, then A to Z); unrated after, A to Z. */
export function rankRecipes(recipes: Recipe[], ratings: RecipeRating[]): RankedRecipe[] {
  const rows = recipes.map((recipe): RankedRecipe => {
    const r = ratings.find((x) => x.recipe_id === recipe.id)
    const count = r?.rated_brews ?? 0
    const beanCount = r?.bean_rated_brews ?? 0
    const showBean = r !== undefined && beanCount >= BEAN_AVERAGE_MIN
    return {
      recipe,
      average: r ? averageOf(r.rating_total, count) : null,
      count,
      beanAverage: showBean ? averageOf(r.bean_rating_total, beanCount) : null,
      beanCount: showBean ? beanCount : 0,
    }
  })
  return rows.sort((a, b) => {
    if (a.average === null || b.average === null) {
      if (a.average !== b.average) return a.average === null ? 1 : -1
      return byName(a, b)
    }
    return b.average - a.average || b.count - a.count || byName(a, b)
  })
}

export function recommendedId(rows: RankedRecipe[]): string | null {
  return rows.length > 0 && rows[0].average !== null ? rows[0].recipe.id : null
}

const shown = (average: number) => formatOneDecimal(Math.round(average * 10) / 10)
const brews = (n: number) => `${n} ${n === 1 ? 'brew' : 'brews'}`

/** "4.3 from 6 brews · this bag 4.5 from 3", or "No ratings yet". */
export function ratingLine(row: RankedRecipe): string {
  if (row.average === null) return 'No ratings yet'
  const overall = `${shown(row.average)} from ${brews(row.count)}`
  return row.beanAverage === null ? overall : `${overall} · this bag ${shown(row.beanAverage)} from ${row.beanCount}`
}

/** The brew to offer as Repeat, when its recipe still belongs to this method. */
export function repeatChoice<T extends Pick<Brew, 'recipe_id'>>(brew: T | null, methodRecipes: Recipe[]): T | null {
  if (!brew || !methodRecipes.some((r) => r.id === brew.recipe_id)) return null
  return brew
}

/** "18.5 g · 22 clicks · Yesterday · 7:42 AM", a blank grind left out. */
export function repeatSummary(brew: Brew, now: Date): string {
  return [`${formatOneDecimal(brew.dose_grams)} g`, brew.grind_size?.trim() || null, brewDayLabel(brew.brewed_at, now)]
    .filter(Boolean)
    .join(' · ')
}

/** The brew screen's starting point: a copy of that brew when it's of this recipe, else the recipe. */
export function startingDraft(
  recipe: Recipe,
  beanId: string,
  brew: Brew | null,
): { draft: BrewDraft; repeating: boolean } {
  if (!brew || brew.recipe_id !== recipe.id) return { draft: draftFromRecipe(recipe, beanId), repeating: false }
  return {
    draft: { ...draftFromBrew(brew), beanId, recipeId: recipe.id, totalSeconds: recipe.total_seconds },
    repeating: true,
  }
}
