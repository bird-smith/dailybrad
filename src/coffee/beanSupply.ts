// "Cups left" and cost per cup for a bag in use. All grams in tenths (whole numbers), so
// doses like 18.1 g never drift; money in whole cents.
import { displayMoney } from './beanForm'
import type { Bean, BeanSupply } from './types'

/** 18.1 -> 181. Rounds, since 18.1 * 10 is not exactly 181 in the browser. */
export function toTenths(grams: number): number {
  return Math.round(grams * 10)
}

/** The bag's last dose; else the latest brew's of any bag; else null. */
export function doseFor(beanId: string, supply: BeanSupply[], latestDoseTenths: number | null): number | null {
  const row = supply.find((s) => s.bean_id === beanId)
  return row ? row.last_dose_tenths : latestDoseTenths
}

/** Whole doses left in the bag, never below 0. */
export function cupsLeft(bagGrams: number, usedTenths: number, doseTenths: number): number {
  const left = bagGrams * 10 - usedTenths
  if (left <= 0) return 0
  return Math.floor(left / doseTenths)
}

/** One dose's share of the bag's cost, to the nearest cent (half a cent rounds up). */
export function costPerCupCents(costCents: number, bagGrams: number, doseTenths: number): number {
  return Math.round((costCents * doseTenths) / (bagGrams * 10))
}

export function cupsText(cups: number): string {
  if (cups === 0) return 'Less than a cup left'
  if (cups === 1) return 'About 1 cup left'
  return `About ${cups} cups left`
}

/** The small line under a bag in use, or null when there's nothing to say. */
export function supplyLine(bean: Bean, supply: BeanSupply[], latestDoseTenths: number | null): string | null {
  if (bean.finished || bean.bag_grams === null) return null
  const used = supply.find((s) => s.bean_id === bean.id)?.used_tenths ?? 0
  const dose = doseFor(bean.id, supply, latestDoseTenths)
  if (dose === null) return `${Math.max(0, Math.floor((bean.bag_grams * 10 - used) / 10))} g left`
  const cups = cupsText(cupsLeft(bean.bag_grams, used, dose))
  if (bean.cost_cents === null) return cups
  return `${cups} · ${displayMoney(costPerCupCents(bean.cost_cents, bean.bag_grams, dose))} a cup`
}
