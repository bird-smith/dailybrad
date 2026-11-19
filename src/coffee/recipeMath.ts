import type { PourUnit, RecipeStep } from './types'

// The pour rule. Water is dose times ratio. A pour is "pour to" a fixed weight, or a
// percentage: of the dose on the first pour (the bloom), of the water after it. The last
// pour always fills to the water. Used by recipes (1.3) and the brew setup (1.4).
// Don't write a second one.

const round2 = (n: number) => Math.round(n * 100) / 100

export function totalWater(dose: number, ratio: number): number {
  return round2(dose * ratio)
}

/** What the % on a pour is of: the dose on the first pour (the bloom), the water after. */
export const percentOf = (pourNumber: number): 'dose' | 'water' => (pourNumber === 0 ? 'dose' : 'water')

/** One pour's "pour to" weight in whole grams. */
export function pourToGrams(to: number, unit: PourUnit, pourNumber: number, dose: number, water: number): number {
  if (unit === 'g') return Math.round(to)
  return Math.round(round2(((percentOf(pourNumber) === 'dose' ? dose : water) * to) / 100))
}

type PourStep = Extract<RecipeStep, { kind: 'pour' }>

/** For each pour: the running total to pour to and the single amount, in whole grams.
 *  The last pour is exactly the rounded water. Recipes saved before 2026-11-19 hold
 *  `percent` (a share of the water) instead, and still read correctly. */
export function pourTargets(pours: PourStep[], dose: number, water: number): { pourTo: number; amount: number }[] {
  let share = 0
  let previous = 0
  return pours.map((pour, i) => {
    let pourTo: number
    if (i === pours.length - 1) pourTo = Math.round(water)
    else if ('percent' in pour) {
      share += pour.percent
      pourTo = Math.round(round2((water * share) / 100))
    } else pourTo = pourToGrams(pour.to ?? 0, pour.unit, i, dose, water)
    const amount = pourTo - previous
    previous = pourTo
    return { pourTo, amount }
  })
}

/** Plain sentence when the pours don't fit the water (for example fixed weights and a
 *  smaller dose), or null. */
export function poursProblem(targets: { pourTo: number; amount: number }[], water: number): string | null {
  const bad = targets.some((t, i) => t.amount <= 0 || (i < targets.length - 1 && t.pourTo >= Math.round(water)))
  return bad ? `The pours don't fit in ${Math.round(water)} g of water. Raise the dose or ratio, or change the recipe.` : null
}
