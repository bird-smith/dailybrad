// Deciding what an import adds: only what's missing, never changing what's on the site.
import {
  BACKUP_DAMAGED,
  type Backup,
  type BackupProblem,
  type BackupRows,
  type BackupTable,
} from './backupFile'

/** What's on the site now: just enough to tell what's missing. */
export type SiteNow = {
  methods: { id: string; name: string }[]
  recipes: { id: string; method_id: string; name: string }[]
  beans: { id: string; is_active: boolean }[]
  brews: { id: string }[]
}

export type ImportPlan = { add: BackupRows; keptCount: number; activeBeanId: string | null }

export type Counts = Record<BackupTable, number>

export const IMPORT_ORDER: BackupTable[] = ['methods', 'beans', 'recipes', 'brews']

const damaged = (table: BackupTable, index: number): BackupProblem => ({
  problem: BACKUP_DAMAGED,
  where: `${table}, row ${index + 1}`,
})

export function planImport(file: Backup, site: SiteNow): ImportPlan | BackupProblem {
  const add: BackupRows = { methods: [], beans: [], recipes: [], brews: [] }
  let keptCount = 0

  // Methods: by id, else by name ignoring capitals (the database allows no two V60s).
  const methodIds = new Set(site.methods.map((m) => m.id))
  const methodByName = new Map(site.methods.map((m) => [m.name.toLowerCase(), m.id]))
  const methodFor = new Map<string, string>()
  for (const row of file.methods) {
    const sameName = methodByName.get(row.name.toLowerCase())
    if (methodIds.has(row.id)) {
      methodFor.set(row.id, row.id)
      keptCount++
    } else if (sameName) {
      methodFor.set(row.id, sameName)
      keptCount++
    } else {
      methodFor.set(row.id, row.id)
      methodByName.set(row.name.toLowerCase(), row.id)
      add.methods.push(row)
    }
  }
  const lookUpMethod = (id: string) => methodFor.get(id) ?? (methodIds.has(id) ? id : undefined)

  // Beans: by id. New ones arrive inactive; the active one is set afterwards.
  const siteBeanIds = new Set(site.beans.map((b) => b.id))
  const fileBeanIds = new Set(file.beans.map((b) => b.id))
  for (const row of file.beans) {
    if (siteBeanIds.has(row.id)) keptCount++
    else add.beans.push({ ...row, is_active: false })
  }

  // Recipes: by id, else by name ignoring capitals within the same method.
  const recipeIds = new Set(site.recipes.map((r) => r.id))
  const recipeKey = (methodId: string, name: string) => `${methodId}|${name.toLowerCase()}`
  const recipeByName = new Map(site.recipes.map((r) => [recipeKey(r.method_id, r.name), r.id]))
  const recipeFor = new Map<string, string>()
  for (const [index, row] of file.recipes.entries()) {
    const methodId = lookUpMethod(row.method_id)
    if (!methodId) return damaged('recipes', index)
    const sameName = recipeByName.get(recipeKey(methodId, row.name))
    if (recipeIds.has(row.id)) {
      recipeFor.set(row.id, row.id)
      keptCount++
    } else if (sameName) {
      recipeFor.set(row.id, sameName)
      keptCount++
    } else {
      recipeFor.set(row.id, row.id)
      recipeByName.set(recipeKey(methodId, row.name), row.id)
      add.recipes.push({ ...row, method_id: methodId })
    }
  }

  // Brews: by id. A recipe that is nowhere leaves the link empty, as deleting one does.
  const brewIds = new Set(site.brews.map((b) => b.id))
  for (const [index, row] of file.brews.entries()) {
    if (brewIds.has(row.id)) {
      keptCount++
      continue
    }
    if (!fileBeanIds.has(row.bean_id) && !siteBeanIds.has(row.bean_id)) return damaged('brews', index)
    const methodId = lookUpMethod(row.method_id)
    if (!methodId) return damaged('brews', index)
    const recipeId = row.recipe_id
      ? (recipeFor.get(row.recipe_id) ?? (recipeIds.has(row.recipe_id) ? row.recipe_id : null))
      : null
    add.brews.push({ ...row, method_id: methodId, recipe_id: recipeId })
  }

  // Active bag: only when none is active now and the file's one is being added.
  const noneActive = !site.beans.some((b) => b.is_active)
  const fileActive = file.beans.find((b) => b.is_active && !b.finished)
  const activeBeanId =
    noneActive && fileActive && add.beans.some((b) => b.id === fileActive.id) ? fileActive.id : null

  return { add, keptCount, activeBeanId }
}

const SINGULAR: Record<BackupTable, string> = { methods: 'method', beans: 'bean', recipes: 'recipe', brews: 'brew' }

const number = (n: number) => n.toLocaleString('en-US')
const noun = (table: BackupTable, n: number) => (n === 1 ? SINGULAR[table] : table)

function joinAnd(parts: string[]): string {
  if (parts.length < 2) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

/** "4 methods, 9 beans, 12 recipes and 412 brews"; zeros left out. */
export function countsSentence(counts: Counts): string {
  return joinAnd(
    IMPORT_ORDER.filter((table) => counts[table] > 0).map(
      (table) => `${number(counts[table])} ${noun(table, counts[table])}`,
    ),
  )
}

export const countsOf = (rows: BackupRows): Counts => ({
  methods: rows.methods.length,
  beans: rows.beans.length,
  recipes: rows.recipes.length,
  brews: rows.brews.length,
})

export function importPreview(plan: ImportPlan): string {
  const sentence = countsSentence(countsOf(plan.add))
  if (!sentence) return 'Everything in this backup is already here.'
  const kept = plan.keptCount > 0 ? ' Everything else in it is already here.' : ''
  return `This adds ${sentence}.${kept}`
}

/** "Adding brews… 500 of 1,412" */
export function progressLine(table: BackupTable, done: number, total: number): string {
  return `Adding ${table}… ${number(done)} of ${number(total)}`
}

export const doneLine = (counts: Counts) => `Done. Added ${countsSentence(counts)}.`

/** After an import stopped partway in `stopped`, which had `total` rows to add. */
export function addedSoFarLine(added: Counts, stopped: BackupTable, total: number): string {
  const before = IMPORT_ORDER.slice(0, IMPORT_ORDER.indexOf(stopped))
  const parts = before
    .filter((table) => added[table] > 0)
    .map((table) => `${number(added[table])} ${noun(table, added[table])}`)
  if (added[stopped] > 0) parts.push(`${number(added[stopped])} of ${number(total)} ${noun(stopped, total)}`)
  const start = parts.length ? `Added so far: ${joinAnd(parts)}.` : 'Nothing was added yet.'
  return `${start} Nothing was lost. Choose the same file again to add the rest.`
}

export function inBatches<T>(rows: T[], size: number): T[][] {
  const batches: T[][] = []
  for (let start = 0; start < rows.length; start += size) batches.push(rows.slice(start, start + size))
  return batches
}
