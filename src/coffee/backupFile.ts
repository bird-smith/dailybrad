// The backup file: what goes in it, its name, and checking a chosen file before import.
import type { Bean, Brew, Method, Recipe } from './types'

export const BACKUP_KIND = 'coffee-backup'
export const BACKUP_VERSION = 1
export const MAX_BACKUP_BYTES = 20_000_000

export const NOT_A_BACKUP = "This file isn't a coffee backup."
export const BACKUP_TOO_BIG = 'This file is too big to be a coffee backup.'
export const BACKUP_NEWER = 'This backup was made by a newer version of the site. Reload this page and try again.'
export const BACKUP_DAMAGED = 'This backup file is damaged, so nothing was added.'

/** Every column of each table except user_id. A later column must be added here. */
export const BACKUP_COLUMNS = {
  methods: ['id', 'name', 'created_at'],
  beans: [
    'id',
    'name',
    'roaster',
    'roast_date',
    'bag_grams',
    'cost_cents',
    'region',
    'process',
    'varietal',
    'notes',
    'finished',
    'is_active',
    'created_at',
  ],
  recipes: [
    'id',
    'method_id',
    'name',
    'ratio',
    'dose_grams',
    'grinder',
    'grind_size',
    'temperature',
    'bloom_seconds',
    'total_seconds',
    'steps',
    'notes',
    'created_at',
  ],
  brews: [
    'id',
    'brewed_at',
    'bean_id',
    'method_id',
    'recipe_id',
    'recipe_name',
    'dose_grams',
    'ratio',
    'grinder',
    'grind_size',
    'temperature',
    'bloom_seconds',
    'brew_seconds',
    'steps',
    'rating',
    'taste_words',
    'rating_note',
  ],
} as const

// Compile-time check: npm run check fails if a table type gains a field missing above,
// or the list names a field the type doesn't have.
type Same<T, L extends readonly string[]> = [Exclude<keyof T, 'user_id' | L[number]>, Exclude<L[number], keyof T>]
type Exact<T extends [never, never]> = T
export type ColumnsCheck = [
  Exact<Same<Method, typeof BACKUP_COLUMNS.methods>>,
  Exact<Same<Bean, typeof BACKUP_COLUMNS.beans>>,
  Exact<Same<Recipe, typeof BACKUP_COLUMNS.recipes>>,
  Exact<Same<Brew, typeof BACKUP_COLUMNS.brews>>,
]

export type BackupTable = keyof typeof BACKUP_COLUMNS

// Rows read from a file: the fields an insert needs, plus whatever else the file had.
export type MethodRow = Pick<Method, 'id' | 'name'> & Partial<Method>
export type BeanRow = Pick<Bean, 'id' | 'name'> & Partial<Bean>
export type RecipeRow = Pick<Recipe, 'id' | 'method_id' | 'name' | 'ratio' | 'dose_grams' | 'steps'> &
  Partial<Recipe>
export type BrewRow = Pick<
  Brew,
  'id' | 'brewed_at' | 'bean_id' | 'method_id' | 'recipe_name' | 'dose_grams' | 'ratio' | 'steps'
> &
  Partial<Brew>

export type BackupRows = { methods: MethodRow[]; beans: BeanRow[]; recipes: RecipeRow[]; brews: BrewRow[] }

export type Backup = { kind: typeof BACKUP_KIND; version: number; exported_at: string } & BackupRows

export type BackupProblem = { problem: string; where?: string }

function pick(row: object, columns: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const column of columns) {
    const value = (row as Record<string, unknown>)[column]
    if (value !== undefined) out[column] = value
  }
  return out
}

export function makeBackup(
  rows: { methods: Method[]; beans: Bean[]; recipes: Recipe[]; brews: Brew[] },
  now: Date,
): Backup {
  return {
    kind: BACKUP_KIND,
    version: BACKUP_VERSION,
    exported_at: now.toISOString(),
    methods: rows.methods.map((row) => pick(row, BACKUP_COLUMNS.methods) as MethodRow),
    beans: rows.beans.map((row) => pick(row, BACKUP_COLUMNS.beans) as BeanRow),
    recipes: rows.recipes.map((row) => pick(row, BACKUP_COLUMNS.recipes) as RecipeRow),
    brews: rows.brews.map((row) => pick(row, BACKUP_COLUMNS.brews) as BrewRow),
  }
}

const two = (n: number) => String(n).padStart(2, '0')

/** coffee-backup-2026-11-18.json, from the local date. */
export function backupFileName(now: Date): string {
  return `coffee-backup-${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}.json`
}

/** "Nov 18, 2026" */
export function backupDateLabel(exportedAt: string): string {
  return new Date(exportedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Check = (value: unknown) => boolean
const isUuid: Check = (v) => typeof v === 'string' && UUID.test(v)
const isText: Check = (v) => typeof v === 'string'
const isNumber: Check = (v) => typeof v === 'number' && Number.isFinite(v)
const isList: Check = (v) => Array.isArray(v)
const isDate: Check = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

// The fields each insert can't do without, and the optional ones checked when present.
const REQUIRED: Record<BackupTable, Record<string, Check>> = {
  methods: { name: isText },
  beans: { name: isText },
  recipes: { method_id: isUuid, name: isText, ratio: isNumber, dose_grams: isNumber, steps: isList },
  brews: {
    brewed_at: isDate,
    bean_id: isUuid,
    method_id: isUuid,
    recipe_name: isText,
    dose_grams: isNumber,
    ratio: isNumber,
    steps: isList,
  },
}
const WHEN_PRESENT: Partial<Record<BackupTable, Record<string, Check>>> = {
  brews: { taste_words: isList, recipe_id: (v) => v === null || isUuid(v) },
}

const TABLES: BackupTable[] = ['methods', 'beans', 'recipes', 'brews']

function readTable(table: BackupTable, value: unknown): Record<string, unknown>[] | BackupProblem {
  if (!Array.isArray(value)) return { problem: BACKUP_DAMAGED, where: table }
  const seen = new Set<string>()
  const rows: Record<string, unknown>[] = []
  for (const [index, row] of value.entries()) {
    const damaged = { problem: BACKUP_DAMAGED, where: `${table}, row ${index + 1}` }
    if (!isObject(row) || !isUuid(row.id)) return damaged
    const id = (row.id as string).toLowerCase()
    if (seen.has(id)) return damaged
    seen.add(id)
    for (const [field, check] of Object.entries(REQUIRED[table])) if (!check(row[field])) return damaged
    for (const [field, check] of Object.entries(WHEN_PRESENT[table] ?? {})) {
      if (row[field] !== undefined && !check(row[field])) return damaged
    }
    rows.push(pick(row, BACKUP_COLUMNS[table]))
  }
  return rows
}

/** The clean backup, or the sentence saying why the file can't be used. */
export function readBackup(text: string): Backup | BackupProblem {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { problem: NOT_A_BACKUP }
  }
  if (!isObject(parsed) || parsed.kind !== BACKUP_KIND) return { problem: NOT_A_BACKUP }
  const { version } = parsed
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return { problem: NOT_A_BACKUP }
  if (version > BACKUP_VERSION) return { problem: BACKUP_NEWER }
  if (!isDate(parsed.exported_at)) return { problem: NOT_A_BACKUP }
  const tables: Record<string, unknown> = {}
  for (const table of TABLES) {
    const rows = readTable(table, parsed[table])
    if ('problem' in rows) return rows
    tables[table] = rows
  }
  return {
    kind: BACKUP_KIND,
    version,
    exported_at: parsed.exported_at as string,
    ...(tables as BackupRows),
  }
}
