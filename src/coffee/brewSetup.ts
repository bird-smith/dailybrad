import { splitFinished } from './beanList'
import { formatClock } from './clock'
import { TEMP_UNIT } from './recipeForm'
import { formatOneDecimal, groupRecipes } from './recipeList'
import { pourTargets, poursProblem, totalWater } from './recipeMath'
import type { Bean, Method, Recipe, RecipeStep } from './types'

export const DOSE_STEP = 0.5
const DOSE_MIN = 1
const DOSE_MAX = 100

/** What a brew is built from: the recipe's settings, possibly changed for today. */
export type BrewDraft = {
  methodId: string
  beanId: string
  recipeId: string
  dose: number
  ratio: number
  grinder: string | null
  grindSize: string | null
  temperature: number | null
  bloomSeconds: number | null
  totalSeconds: number | null
  steps: RecipeStep[]
}

export type BrewRow =
  | { kind: 'pour'; pourTo: number; amount: number; at: number | null }
  | { kind: 'action'; text: string; at: number | null }

export function draftFromRecipe(recipe: Recipe, beanId: string): BrewDraft {
  return {
    methodId: recipe.method_id,
    beanId,
    recipeId: recipe.id,
    dose: recipe.dose_grams,
    ratio: recipe.ratio,
    grinder: recipe.grinder,
    grindSize: recipe.grind_size,
    temperature: recipe.temperature,
    bloomSeconds: recipe.bloom_seconds,
    totalSeconds: recipe.total_seconds,
    steps: [...recipe.steps],
  }
}

/** Water in whole grams, each row in order (pours with running total and amount), and a
 *  sentence when the pours don't fit the water. */
export function brewRows(draft: BrewDraft): { water: number; rows: BrewRow[]; problem: string | null } {
  const water = Math.round(totalWater(draft.dose, draft.ratio))
  const targets = pourTargets(
    draft.steps.flatMap((step) => (step.kind === 'pour' ? [step] : [])),
    draft.dose,
    water,
  )
  let pourNumber = 0
  const rows = draft.steps.map((step): BrewRow =>
    step.kind === 'pour'
      ? { kind: 'pour', ...targets[pourNumber++], at: step.at }
      : { kind: 'action', text: step.text, at: step.at },
  )
  return { water, rows, problem: poursProblem(targets, water) }
}

export function stepDose(dose: number, direction: 1 | -1): number {
  const next = Math.round((dose + direction * DOSE_STEP) * 10) / 10
  return Math.min(DOSE_MAX, Math.max(DOSE_MIN, next))
}

const showTemp = (t: number | null) => (t === null ? null : `${t} ${TEMP_UNIT}`)
const showBloom = (s: number | null) => (s === null ? null : formatClock(s))

export type ChangeableSetting = 'ratio' | 'grinder' | 'grindSize' | 'temperature' | 'bloomSeconds'

/** Settings changed for today, each with the recipe's own value to show ("none" if blank). */
export function changedSettings(draft: BrewDraft, recipe: Recipe): Partial<Record<ChangeableSetting, string>> {
  const pairs: [ChangeableSetting, unknown, unknown, string | null][] = [
    ['ratio', draft.ratio, recipe.ratio, `1:${formatOneDecimal(recipe.ratio)}`],
    ['grinder', draft.grinder, recipe.grinder, recipe.grinder],
    ['grindSize', draft.grindSize, recipe.grind_size, recipe.grind_size],
    ['temperature', draft.temperature, recipe.temperature, showTemp(recipe.temperature)],
    ['bloomSeconds', draft.bloomSeconds, recipe.bloom_seconds, showBloom(recipe.bloom_seconds)],
  ]
  return Object.fromEntries(
    pairs.filter(([, today, saved]) => today !== saved).map(([key, , , shown]) => [key, shown ?? 'none']),
  )
}

/** "Comandante · 18 clicks · 93 °C · 1:15 · bloom 0:45", blanks left out. */
export function settingsSummary(draft: BrewDraft): string {
  return [
    draft.grinder,
    draft.grindSize,
    showTemp(draft.temperature),
    `1:${formatOneDecimal(draft.ratio)}`,
    draft.bloomSeconds === null ? null : `bloom ${formatClock(draft.bloomSeconds)}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

/** What Choose a brew offers: defaults, the bags in use, and recipes per method. */
export function brewChoices(methods: Method[], beans: Bean[], recipes: Recipe[]) {
  const bags = splitFinished(beans).inUse
  return {
    defaultMethodId: methods.length === 1 ? methods[0].id : null,
    defaultBeanId: bags.find((bean) => bean.is_active)?.id ?? null,
    bags,
    groups: groupRecipes(methods, recipes),
  }
}
