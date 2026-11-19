import type { Bean } from './types'

// Active bag first, then newest roast, bags with no roast date after those, ties by name.
export function sortBeans(beans: Bean[]): Bean[] {
  return [...beans].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1
    if (a.roast_date !== b.roast_date) {
      if (!a.roast_date) return 1
      if (!b.roast_date) return -1
      return a.roast_date > b.roast_date ? -1 : 1
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

export function splitFinished(beans: Bean[]): { inUse: Bean[]; finished: Bean[] } {
  const sorted = sortBeans(beans)
  return {
    inUse: sorted.filter((bean) => !bean.finished),
    finished: sorted.filter((bean) => bean.finished),
  }
}
