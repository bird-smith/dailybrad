import type { Bean, BeanValues } from './types'

// What the bean form holds: exactly what's in the boxes, as typed.
export type BeanForm = {
  name: string
  roaster: string
  roastDate: string
  bagGrams: string
  cost: string
  region: string
  process: string
  varietal: string
  notes: string
}

export const EMPTY_BEAN_FORM: BeanForm = {
  name: '',
  roaster: '',
  roastDate: '',
  bagGrams: '',
  cost: '',
  region: '',
  process: '',
  varietal: '',
  notes: '',
}

export type BeanCheck = { ok: true; values: BeanValues } | { ok: false; errors: Partial<Record<keyof BeanForm, string>> }

const MAX_COST_CENTS = 100000
const MAX_BAG_GRAMS = 5000

/** Cents, or null for blank. "22.50", "$22.50" and "22" all work. */
export function parseMoney(text: string): { ok: true; cents: number | null } | { ok: false } {
  const trimmed = text.trim()
  if (!trimmed) return { ok: true, cents: null }
  const match = /^\$?\s*(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed)
  if (!match) return { ok: false }
  const dollars = Number(match[1])
  const cents = Number((match[2] ?? '').padEnd(2, '0'))
  return { ok: true, cents: dollars * 100 + cents }
}

/** 2250 -> "22.50", for a form box. */
export function formatMoney(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}

/** 2250 -> "$22.50", for reading. Change the sign here if he pays in another currency. */
export function displayMoney(cents: number): string {
  return `$${formatMoney(cents)}`
}

// Counts characters the way the database does (an emoji is one, not two).
const length = (text: string) => [...text].length

export function checkBean(form: BeanForm, today: string): BeanCheck {
  const errors: Partial<Record<keyof BeanForm, string>> = {}
  const text = (key: keyof BeanForm, max: number, label: string) => {
    const value = form[key].trim()
    if (length(value) > max) errors[key] = `Keep ${label} to ${max} characters.`
    return value || null
  }

  const name = text('name', 100, 'the name')
  if (!name) errors.name = 'Give the bean a name.'
  const roaster = text('roaster', 100, 'the roaster')
  const region = text('region', 100, 'the region')
  const process = text('process', 100, 'the process')
  const varietal = text('varietal', 100, 'the varietal')
  const notes = text('notes', 2000, 'the tasting notes')

  const roast_date = form.roastDate.trim() || null
  if (roast_date && !/^\d{4}-\d{2}-\d{2}$/.test(roast_date)) errors.roastDate = 'Pick a date.'
  else if (roast_date && roast_date > today) errors.roastDate = "Roast date can't be in the future."

  let bag_grams: number | null = null
  const bagText = form.bagGrams.trim()
  if (bagText) {
    if (!/^\d+$/.test(bagText)) errors.bagGrams = 'Bag size should be a whole number of grams.'
    else {
      bag_grams = Number(bagText)
      if (bag_grams < 1 || bag_grams > MAX_BAG_GRAMS) {
        errors.bagGrams = `Bag size should be between 1 and ${MAX_BAG_GRAMS} grams.`
      }
    }
  }

  let cost_cents: number | null = null
  const money = parseMoney(form.cost)
  if (!money.ok) errors.cost = 'Cost should be a price, like 22.50.'
  else {
    cost_cents = money.cents
    if (cost_cents !== null && cost_cents > MAX_COST_CENTS) {
      errors.cost = `Cost should be ${displayMoney(MAX_COST_CENTS)} or less.`
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    values: { name: name!, roaster, roast_date, bag_grams, cost_cents, region, process, varietal, notes },
  }
}

/** Fills the form from a saved bean, for editing. */
export function beanToForm(bean: Bean): BeanForm {
  return {
    name: bean.name,
    roaster: bean.roaster ?? '',
    roastDate: bean.roast_date ?? '',
    bagGrams: bean.bag_grams === null ? '' : String(bean.bag_grams),
    cost: bean.cost_cents === null ? '' : formatMoney(bean.cost_cents),
    region: bean.region ?? '',
    process: bean.process ?? '',
    varietal: bean.varietal ?? '',
    notes: bean.notes ?? '',
  }
}
