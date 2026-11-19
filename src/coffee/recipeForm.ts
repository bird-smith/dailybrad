import { formatClock, parseClock } from './clock'
import { formatNumber } from './recipeList'
import { pourTargets, poursToPercents, totalWater } from './recipeMath'
import type { Recipe, RecipeStep, RecipeValues } from './types'

// Temperature unit. For Fahrenheit: '°F', 158 to 212.
export const TEMP_UNIT = '°C'
export const TEMP_MIN = 70
export const TEMP_MAX = 100

export const MAX_ROWS = 20
const STEP_TEXT_MAX = 60

// One row of pours and steps as typed. key keeps React rows steady when moved.
// The last pour's pourTo is ignored: it is always "the rest".
export type FormRow =
  | { key: string; kind: 'pour'; pourTo: string; at: string }
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

/** Water for the typed dose and ratio, or null until both make sense. */
export function formWater(form: Pick<RecipeForm, 'dose' | 'ratio'>): number | null {
  const dose = parseOneDecimal(form.dose)
  const ratio = parseOneDecimal(form.ratio)
  if (dose === null || ratio === null || dose < 1 || dose > 100 || ratio < 1 || ratio > 30) return null
  return totalWater(dose, ratio)
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

  const ratio = parseOneDecimal(form.ratio)
  if (!form.ratio.trim()) errors.ratio = 'Type the ratio, like 15.'
  else if (ratio === null || ratio < 1 || ratio > 30) errors.ratio = 'Ratio should be between 1 and 30, like 15 or 15.5.'

  const dose = parseOneDecimal(form.dose)
  if (!form.dose.trim()) errors.dose = 'Type the dose in grams, like 18.'
  else if (dose === null || dose < 1 || dose > 100) errors.dose = 'Dose should be between 1 and 100 grams, like 18 or 18.5.'

  const text = (value: string, max: number, key: FieldKey, label: string) => {
    const trimmed = value.trim()
    if (length(trimmed) > max) errors[key] = `Keep ${label} to ${max} characters.`
    return trimmed || null
  }
  const grinder = text(form.grinder, 60, 'grinder', 'the grinder')
  const grind_size = text(form.grindSize, 30, 'grindSize', 'the grind size')
  const notes = text(form.notes, 2000, 'notes', 'the notes')

  let temperature: number | null = null
  const tempText = form.temperature.trim()
  if (tempText) {
    temperature = /^\d+$/.test(tempText) ? Number(tempText) : null
    if (temperature === null || temperature < TEMP_MIN || temperature > TEMP_MAX) {
      errors.temperature = `Temperature should be a whole number from ${TEMP_MIN} to ${TEMP_MAX} ${TEMP_UNIT}.`
    }
  }

  const time = (value: string, key: FieldKey, max: number) => {
    const parsed = parseClock(value)
    if (!parsed.ok) {
      errors[key] = parsed.message
      return null
    }
    if (parsed.seconds !== null && (parsed.seconds < 1 || parsed.seconds > max)) {
      errors[key] = `Keep it between 0:01 and ${formatClock(max)}.`
    }
    return parsed.seconds
  }
  const bloom_seconds = time(form.bloom, 'bloom', 600)
  const total_seconds = time(form.total, 'total', 3600)

  // Pours and steps.
  if (form.rows.length > MAX_ROWS) errors.rows = `Keep it to ${MAX_ROWS} pours and steps.`
  const water = ratio !== null && dose !== null && !errors.ratio && !errors.dose ? totalWater(dose, ratio) : null
  const lastPour = lastPourIndex(form.rows)
  const pourTo: number[] = []
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
    const weight = parseOneDecimal(row.pourTo)
    const previous = pourTo.length ? pourTo[pourTo.length - 1] : 0
    if (weight === null) rowErrors[i] ??= 'Type how much to pour to, in grams, like 135.'
    else if (weight <= previous) rowErrors[i] ??= 'Each pour should be more than the one before.'
    else if (water !== null && weight >= water) {
      rowErrors[i] ??= `Each pour should be less than the total water (${formatNumber(water)} g).`
    }
    pourTo.push(weight ?? previous)
  })

  if (Object.keys(errors).length > 0 || rowErrors.some(Boolean) || water === null) {
    return { ok: false, errors, rowErrors }
  }

  const percents = lastPour === -1 ? [] : poursToPercents(pourTo, water)
  let pourNumber = 0
  const steps: RecipeStep[] = form.rows.map((row, i) =>
    row.kind === 'pour'
      ? { kind: 'pour', percent: percents[pourNumber++], at: ats[i] }
      : { kind: 'action', text: row.text.trim(), at: ats[i] },
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

/** Fills the form from a saved recipe: shares become "pour to" weights at its own dose. */
export function recipeToForm(recipe: Recipe): RecipeForm {
  const water = totalWater(recipe.dose_grams, recipe.ratio)
  const targets = pourTargets(
    recipe.steps.flatMap((step) => (step.kind === 'pour' ? [step.percent] : [])),
    water,
  )
  let pourNumber = 0
  const at = (seconds: number | null) => (seconds === null ? '' : formatClock(seconds))
  return {
    methodId: recipe.method_id,
    name: recipe.name,
    ratio: formatNumber(recipe.ratio),
    dose: formatNumber(recipe.dose_grams),
    grinder: recipe.grinder ?? '',
    grindSize: recipe.grind_size ?? '',
    temperature: recipe.temperature === null ? '' : String(recipe.temperature),
    bloom: recipe.bloom_seconds === null ? '' : formatClock(recipe.bloom_seconds),
    total: recipe.total_seconds === null ? '' : formatClock(recipe.total_seconds),
    notes: recipe.notes ?? '',
    rows: recipe.steps.map((step) =>
      step.kind === 'pour'
        ? { key: newRowKey(), kind: 'pour', pourTo: String(targets[pourNumber++].pourTo), at: at(step.at) }
        : { key: newRowKey(), kind: 'action', text: step.text, at: at(step.at) },
    ),
  }
}
