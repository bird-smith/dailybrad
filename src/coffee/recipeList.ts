import type { Method, Recipe } from './types'

/** Each method in the given order, with its recipes A to Z. */
export function groupRecipes(methods: Method[], recipes: Recipe[]): { method: Method; recipes: Recipe[] }[] {
  return methods.map((method) => ({
    method,
    recipes: recipes
      .filter((recipe) => recipe.method_id === method.id)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
  }))
}

/** "15" for 15 or 15.0, "15.5" for 15.5. */
export const formatOneDecimal = (n: number) => String(Number(n))

/** "1:15 · 18 g · 3 pours" */
export function recipeSummary(recipe: Recipe): string {
  const pours = recipe.steps.filter((step) => step.kind === 'pour').length
  const parts = [`1:${formatOneDecimal(recipe.ratio)}`, `${formatOneDecimal(recipe.dose_grams)} g`]
  if (pours > 0) parts.push(`${pours} ${pours === 1 ? 'pour' : 'pours'}`)
  return parts.join(' · ')
}
