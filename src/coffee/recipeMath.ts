// The scaling rule: pours are shares of the total water, and water is dose times ratio.
// Used by recipes (1.3) and the brew setup (1.4). Don't write a second one.

const round2 = (n: number) => Math.round(n * 100) / 100

export function totalWater(dose: number, ratio: number): number {
  return round2(dose * ratio)
}

/** For each pour: the running total to pour to and the single amount, in whole grams.
 *  The last running total is exactly the rounded water, so the amounts always add up. */
export function pourTargets(percents: number[], water: number): { pourTo: number; amount: number }[] {
  let share = 0
  let previous = 0
  return percents.map((percent, i) => {
    share += percent
    const pourTo = i === percents.length - 1 ? Math.round(water) : Math.round(round2((water * share) / 100))
    const amount = pourTo - previous
    previous = pourTo
    return { pourTo, amount }
  })
}

/** The reverse, for saving: "pour to" weights of every pour but the last (which is the
 *  rest) become shares, rounded to two decimals, totalling exactly 100. */
export function poursToPercents(pourTo: number[], water: number): number[] {
  let previous = 0
  const shares = pourTo.map((to) => {
    const share = round2(((to - previous) / water) * 100)
    previous = to
    return share
  })
  const used = shares.reduce((sum, share) => sum + share, 0)
  return [...shares, round2(100 - used)]
}
