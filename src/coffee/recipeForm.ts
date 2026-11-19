import { formatClock, parseClock } from './clock'
import { formatOneDecimal } from './recipeList'
import { percentOf, pourTargets, pourToGrams, totalWater } from './recipeMath'
import type { PourUnit, Recipe, RecipeStep, RecipeValues } from './types'

// Temperature unit. For Fahrenheit: '°F', 158 to 212.
export const TEMP_UNIT = '°C'
export const TEMP_MIN = 70
export const TEMP_MAX = 100

export const MAX_ROWS = 20
const STEP_TEXT_MAX = 60

// One row of pours and steps as typed. key keeps React rows steady when moved.
// The last pour's pourTo and unit are ignored: it always fills to the water.
export type FormRow =
  | { key: string; kind: 'pour'; pourTo: string; unit: PourUnit; at: string }
  | { key: string; kind: 'action'; text: string; at: string }

export type RecipeForm = {
  methodId: string
  name: string
  ratio: string
  dose: string
  grinder: string
  grindSize: string
  temperature: string
  bloom: string
  total: string
  notes: string
  rows: FormRow[]
}

export const EMPTY_RECIPE_FORM: RecipeForm = {
  methodId: '',
  name: '',
  ratio: '',
  dose: '',
  grinder: '',
  grindSize: '',
  temperature: '',
  bloom: '',
  total: '',
  notes: '',
  rows: [],
}

type FieldKey = Exclude<keyof RecipeForm, 'rows'> | 'rows'

export type RecipeCheck =
  | { ok: true; values: RecipeValues }
  | { ok: false; errors: Partial<Record<FieldKey, string>>; rowErrors: (string | undefined)[] }

const length = (text: string) => [...text].length

/** A number with at most one decimal place ("15", "15.5"), or null if it isn't one. */
export function parseOneDecimal(text: string): number | null {
  const trimmed = text.trim()
  return /^\d+(\.\d)?$/.test(trimmed) ? Number(trimmed) : null
}

// Single-box checks, shared by the recipe page and the brew screen so both accept the same.
export type BoxCheck<T> = { ok: true; value: T } | { ok: false; message: string }

export function checkRatio(text: string): BoxCheck<number> {
  const ratio = parseOneDecimal(text)
  if (!text.trim()) return { ok: false, message: 'Type the ratio, like 15.' }
  if (ratio === null || ratio < 1 || ratio > 30) {
    return { ok: false, message: 'Ratio should be between 1 and 30, like 15 or 15.5.' }
  }
  return { ok: true, value: ratio }
}

export function checkDose(text: string): BoxCheck<number> {
  const dose = parseOneDecimal(text)
  if (!text.trim()) return { ok: false, message: 'Type the dose in grams, like 18.' }
  if (dose === null || dose < 1 || dose > 100) {
    return { ok: false, message: 'Dose should be 1 to 100 g, like 18 or 18.5.' }
  }
  return { ok: true, value: dose }
}

/** Blank is "not given". */
export function checkTemperature(text: string): BoxCheck<number | null> {
  const trimmed = text.trim()
  if (!trimmed) return { ok: true, value: null }
  const temperature = /^\d+$/.test(trimmed) ? Number(trimmed) : null
  if (temperature === null || temperature < TEMP_MIN || temperature > TEMP_MAX) {
    return { ok: false, message: `Temperature should be a whole number from ${TEMP_MIN} to ${TEMP_MAX} ${TEMP_UNIT}.` }
  }
  return { ok: true, value: temperature }
}

/** Trimmed text; blank is "not given". */
export function checkShortText(text: string, max: number): BoxCheck<string | null> {
  const trimmed = text.trim()
  if (length(trimmed) > max) return { ok: false, message: `Keep it to ${max} characters.` }
  return { ok: true, value: trimmed || null }
}

/** A time box; blank is "not given". */
export function checkTime(text: string, max: number): BoxCheck<number | null> {
  const parsed = parseClock(text)
  if (!parsed.ok) return { ok: false, message: parsed.message }
  if (parsed.seconds !== null && (parsed.seconds < 1 || parsed.seconds > max)) {
    return { ok: false, message: `Keep it between 0:01 and ${formatClock(max)}.` }
  }
  return { ok: true, value: parsed.seconds }
}

export const checkBloom = (text: string) => checkTime(text, 600)

/** Water for the typed dose and ratio, or null until both make sense. */
export function formWater(form: Pick<RecipeForm, 'dose' | 'ratio'>): number | null {
  const dose = checkDose(form.dose)
  const ratio = checkRatio(form.ratio)
  return dose.ok && ratio.ok ? totalWater(dose.value, ratio.value) : null
}

/** Index of the last pour row, or -1. */
export const lastPourIndex = (rows: FormRow[]) => rows.map((r) => r.kind).lastIndexOf('pour')

export function checkRecipe(form: RecipeForm, otherNamesInMethod: string[], methodName = 'this method'): RecipeCheck {
  const errors: Partial<Record<FieldKey, string>> = {}
  const rowErrors: (string | undefined)[] = form.rows.map(() => undefined)

  if (!form.methodId) errors.methodId = 'Pick a method.'

  const name = form.name.trim()
  if (!name) errors.name = 'Give the recipe a name.'
  else if (length(name) > 60) errors.name = 'Keep the name to 60 characters.'
  else {
    const clash = otherNamesInMethod.find((other) => other.toLowerCase() === name.toLowerCase())
    if (clash) errors.name = `You already have a recipe called ${clash} for ${methodName}.`
  }

  const take = <T,>(check: BoxCheck<T>, key: FieldKey): T | null => {
    if (check.ok) return check.value
    errors[key] = check.message
    return null
  }
  const ratio = take(checkRatio(form.ratio), 'ratio')
  const dose = take(checkDose(form.dose), 'dose')
  const grinder = take(checkShortText(form.grinder, 60), 'grinder')
  const grind_size = take(checkShortText(form.grindSize, 30), 'grindSize')
  const notes = take(checkShortText(form.notes, 2000), 'notes')
  const temperature = take(checkTemperature(form.temperature), 'temperature')
  const bloom_seconds = take(checkBloom(form.bloom), 'bloom')
  const total_seconds = take(checkTime(form.total, 3600), 'total')

  // Pours and steps.
  if (form.rows.length > MAX_ROWS) errors.rows = `Keep it to ${MAX_ROWS} pours and steps.`
  const water = ratio !== null && dose !== null && !errors.ratio && !errors.dose ? totalWater(dose, ratio) : null
  const lastPour = lastPourIndex(form.rows)
  const pourTo: number[] = []
  const saved: Record<number, RecipeStep> = {}
  const ats: (number | null)[] = []
  let latestAt = -1
  form.rows.forEach((row, i) => {
    const at = parseClock(row.at)
    if (!at.ok) rowErrors[i] = at.message
    else if (at.seconds !== null) {
      if (at.seconds < latestAt) rowErrors[i] = "This time is before an earlier row's time."
      latestAt = Math.max(latestAt, at.seconds)
    }
    ats.push(at.ok ? at.seconds : null)

    if (row.kind === 'action') {
      const step = row.text.trim()
      if (!step) rowErrors[i] ??= 'Type what to do, like Open valve.'
      else if (length(step) > STEP_TEXT_MAX) rowErrors[i] ??= `Keep steps to ${STEP_TEXT_MAX} characters.`
      return
    }
    if (i === lastPour) return
    const pourNumber = pourTo.length
    const typed = parseOneDecimal(row.pourTo)
    const previous = pourNumber ? pourTo[pourNumber - 1] : 0
    const grams = typed === null || water === null ? typed : pourToGrams(typed, row.unit, pourNumber, dose!, water)
    if (typed === null || typed <= 0) {
      rowErrors[i] ??=
        row.unit === 'g'
          ? 'Type how much to pour to, in grams, like 135.'
          : `Type a percentage of the ${percentOf(pourNumber)}, like ${pourNumber === 0 ? 250 : 50}.`
    } else if (row.unit === '%' && percentOf(pourNumber) === 'water' && typed >= 100) {
      rowErrors[i] ??= 'Keep it under 100% of the water.'
    } else if (row.unit === '%' && typed > 1000) {
      rowErrors[i] ??= 'Keep it to 1000% of the dose or less.'
    } else if (grams !== null && grams <= previous) {
      rowErrors[i] ??= 'Each pour should be more than the one before.'
    } else if (water !== null && grams !== null && grams >= water) {
      rowErrors[i] ??= `Each pour should be less than the total water (${formatOneDecimal(water)} g).`
    }
    pourTo.push(grams ?? previous)
    saved[i] = { kind: 'pour', to: typed ?? 0, unit: row.unit, at: null }
  })

  if (Object.keys(errors).length > 0 || rowErrors.some(Boolean) || water === null) {
    return { ok: false, errors, rowErrors }
  }

  const steps: RecipeStep[] = form.rows.map((row, i) =>
    row.kind === 'action'
      ? { kind: 'action', text: row.text.trim(), at: ats[i] }
      : i === lastPour
        ? { kind: 'pour', to: null, unit: 'g', at: ats[i] }
        : { ...saved[i], at: ats[i] },
  )

  return {
    ok: true,
    values: {
      method_id: form.methodId,
      name,
      ratio: ratio!,
      dose_grams: dose!,
      grinder,
      grind_size,
      temperature,
      bloom_seconds,
      total_seconds,
      steps,
      notes,
    },
  }
}

let nextKey = 0
export const newRowKey = () => `row-${nextKey++}`

/** Fills the form from a saved recipe. Old shares of the water become "pour to" weights
 *  at its own dose. */
export function recipeToForm(recipe: Recipe): RecipeForm {
  const water = totalWater(recipe.dose_grams, recipe.ratio)
  const pours = recipe.steps.flatMap((step) => (step.kind === 'pour' ? [step] : []))
  const targets = pourTargets(pours, recipe.dose_grams, water)
  let pourNumber = 0
  const at = (seconds: number | null) => (seconds === null ? '' : formatClock(seconds))
  return {
    methodId: recipe.method_id,
    name: recipe.name,
    ratio: formatOneDecimal(recipe.ratio),
    dose: formatOneDecimal(recipe.dose_grams),
    grinder: recipe.grinder ?? '',
    grindSize: recipe.grind_size ?? '',
    temperature: recipe.temperature === null ? '' : String(recipe.temperature),
    bloom: recipe.bloom_seconds === null ? '' : formatClock(recipe.bloom_seconds),
    total: recipe.total_seconds === null ? '' : formatClock(recipe.total_seconds),
    notes: recipe.notes ?? '',
    rows: recipe.steps.map((step) =>
      step.kind === 'pour'
        ? { key: newRowKey(), kind: 'pour', ...pourBox(step, targets[pourNumber++].pourTo), at: at(step.at) }
        : { key: newRowKey(), kind: 'action', text: step.text, at: at(step.at) },
    ),
  }
}

/** What a saved pour shows in its box: its own number and unit, or grams for old shares. */
function pourBox(step: Extract<RecipeStep, { kind: 'pour' }>, grams: number): { pourTo: string; unit: PourUnit } {
  if ('percent' in step || step.to === null) return { pourTo: String(grams), unit: 'g' }
  return { pourTo: formatOneDecimal(step.to), unit: step.unit }
}
