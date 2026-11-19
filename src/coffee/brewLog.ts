import type { BrewDraft } from './brewSetup'
import { formatClock } from './clock'
import { checkBloom, checkDose, checkRatio, checkShortText, checkTemperature, checkTime, type BoxCheck } from './recipeForm'
import { formatOneDecimal } from './recipeList'
import { daysSinceRoast } from './roastAge'
import type { Bean, Brew, BrewValues, Method, Recipe } from './types'

export const checkBrewTime = (text: string) => checkTime(text, 3600)

/** The values to log, all copied from today's draft. Never user_id or brewed_at. */
export function brewToSave(
  draft: BrewDraft,
  recipeName: string,
  brewTimeText: string,
): { ok: true; values: BrewValues } | { ok: false; message: string } {
  const brewTime = checkBrewTime(brewTimeText)
  if (!brewTime.ok) return { ok: false, message: brewTime.message }
  return {
    ok: true,
    values: {
      bean_id: draft.beanId,
      method_id: draft.methodId,
      recipe_id: draft.recipeId,
      recipe_name: recipeName,
      dose_grams: draft.dose,
      ratio: draft.ratio,
      grinder: draft.grinder,
      grind_size: draft.grindSize,
      temperature: draft.temperature,
      bloom_seconds: draft.bloomSeconds,
      brew_seconds: brewTime.value,
      steps: [...draft.steps],
    },
  }
}

/** A saved brew as a draft, so water and pours come from the same rule as the brew screen. */
export function draftFromBrew(brew: Brew): BrewDraft {
  return {
    methodId: brew.method_id,
    beanId: brew.bean_id,
    recipeId: brew.recipe_id ?? '',
    dose: brew.dose_grams,
    ratio: brew.ratio,
    grinder: brew.grinder,
    grindSize: brew.grind_size,
    temperature: brew.temperature,
    bloomSeconds: brew.bloom_seconds,
    totalSeconds: null,
    steps: [...brew.steps],
  }
}

export type BrewFixForm = {
  beanId: string
  dose: string
  ratio: string
  grinder: string
  grindSize: string
  temperature: string
  bloom: string
  brewTime: string
}

export type BrewFix = Pick<
  BrewValues,
  'bean_id' | 'dose_grams' | 'ratio' | 'grinder' | 'grind_size' | 'temperature' | 'bloom_seconds' | 'brew_seconds'
>

export function brewToFixForm(brew: Brew): BrewFixForm {
  const time = (s: number | null) => (s === null ? '' : formatClock(s))
  return {
    beanId: brew.bean_id,
    dose: formatOneDecimal(brew.dose_grams),
    ratio: formatOneDecimal(brew.ratio),
    grinder: brew.grinder ?? '',
    grindSize: brew.grind_size ?? '',
    temperature: brew.temperature === null ? '' : String(brew.temperature),
    bloom: time(brew.bloom_seconds),
    brewTime: time(brew.brew_seconds),
  }
}

export function checkBrewFix(
  form: BrewFixForm,
): { ok: true; changes: BrewFix } | { ok: false; errors: Partial<Record<keyof BrewFixForm, string>> } {
  const errors: Partial<Record<keyof BrewFixForm, string>> = {}
  const take = <T,>(check: BoxCheck<T>, key: keyof BrewFixForm): T | null => {
    if (check.ok) return check.value
    errors[key] = check.message
    return null
  }
  if (!form.beanId) errors.beanId = 'Pick a bag.'
  const changes = {
    bean_id: form.beanId,
    dose_grams: take(checkDose(form.dose), 'dose'),
    ratio: take(checkRatio(form.ratio), 'ratio'),
    grinder: take(checkShortText(form.grinder, 60), 'grinder'),
    grind_size: take(checkShortText(form.grindSize, 30), 'grindSize'),
    temperature: take(checkTemperature(form.temperature), 'temperature'),
    bloom_seconds: take(checkBloom(form.bloom), 'bloom'),
    brew_seconds: take(checkBrewTime(form.brewTime), 'brewTime'),
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return { ok: true, changes: changes as BrewFix }
}

// Fixed en-US wording, so it reads the same on every device and in tests.
const TIME: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }
const THIS_YEAR: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
const OTHER_YEAR: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
const plainSpaces = (text: string) => text.replace(/[  ]/g, ' ')

/** "Today · 7:42 AM", "Yesterday · …", "Mon, Nov 16 · …", "Nov 16, 2025 · …" */
export function brewDayLabel(brewedAt: string, now: Date): string {
  const when = new Date(brewedAt)
  const time = plainSpaces(when.toLocaleTimeString('en-US', TIME))
  const days = Math.round(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
      Date.UTC(when.getFullYear(), when.getMonth(), when.getDate())) /
      86400000,
  )
  let day: string
  if (days === 0) day = 'Today'
  else if (days === 1) day = 'Yesterday'
  else day = when.toLocaleDateString('en-US', when.getFullYear() === now.getFullYear() ? THIS_YEAR : OTHER_YEAR)
  return `${plainSpaces(day)} · ${time}`
}

/** "9 days after roast" on the day of the brew; nothing without a roast date. */
export function roastAgeOnBrewDay(roastDate: string | null, brewedAt: string): string | null {
  const days = daysSinceRoast(roastDate, new Date(brewedAt))
  if (days === null || days < 0) return null
  if (days === 0) return 'Roast day'
  return `${days} ${days === 1 ? 'day' : 'days'} after roast`
}

export type HistoryRow = { brew: Brew; recipeName: string; beanName: string; methodName: string; dayLabel: string }

export function historyRows(brews: Brew[], beans: Bean[], methods: Method[], recipes: Recipe[], now: Date): HistoryRow[] {
  const name = <T extends { id: string; name: string }>(list: T[], id: string | null) =>
    list.find((item) => item.id === id)?.name
  return brews.map((brew) => ({
    brew,
    recipeName: name(recipes, brew.recipe_id) ?? brew.recipe_name,
    beanName: name(beans, brew.bean_id) ?? '',
    methodName: name(methods, brew.method_id) ?? '',
    dayLabel: brewDayLabel(brew.brewed_at, now),
  }))
}
