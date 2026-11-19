import type { Bean, Brew, Method, Recipe } from './types'

/** History narrowed to one bean, method and/or recipe; each part optional. */
export type HistoryFilter = { bean?: string; method?: string; recipe?: string }

const KEYS = ['bean', 'method', 'recipe'] as const
const ID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function filterFromParams(params: URLSearchParams): HistoryFilter {
  const filter: HistoryFilter = {}
  for (const key of KEYS) {
    const value = params.get(key)
    if (value && ID_SHAPE.test(value)) filter[key] = value
  }
  return filter
}

export function filterToParams(filter: HistoryFilter): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of KEYS) if (filter[key]) params.set(key, filter[key])
  return params
}

export const isFiltered = (filter: HistoryFilter) => KEYS.some((key) => filter[key])

/** Same bean, method and recipe; recipe left out once it's deleted. */
export function brewsLikeThis(brew: Pick<Brew, 'bean_id' | 'method_id' | 'recipe_id'>): HistoryFilter {
  const filter: HistoryFilter = { bean: brew.bean_id, method: brew.method_id }
  if (brew.recipe_id) filter.recipe = brew.recipe_id
  return filter
}

/** "Ethiopia Guji · V60 · Kasuya", skipping parts not chosen or not found. */
export function filterSummary(filter: HistoryFilter, beans: Bean[], methods: Method[], recipes: Recipe[]): string {
  const name = (list: { id: string; name: string }[], id?: string) => (id ? list.find((item) => item.id === id)?.name : undefined)
  return [name(beans, filter.bean), name(methods, filter.method), name(recipes, filter.recipe)].filter(Boolean).join(' · ')
}

/** "Kasuya · V60", sorted by method, then recipe name. */
export function recipeOptions(recipes: Recipe[], methods: Method[]): { id: string; label: string }[] {
  const methodName = (id: string) => methods.find((m) => m.id === id)?.name ?? ''
  return recipes
    .map((r) => ({ id: r.id, name: r.name, method: methodName(r.method_id) }))
    .sort((a, b) => a.method.localeCompare(b.method) || a.name.localeCompare(b.name))
    .map((r) => ({ id: r.id, label: r.method ? `${r.name} · ${r.method}` : r.name }))
}
