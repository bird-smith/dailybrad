// Reading everything for a backup, and adding a backup's missing rows back.
import { db, run, type DataError, type DataResult } from '../lib/dataResult'
import { BACKUP_COLUMNS, type BackupRows, type BackupTable } from './backupFile'
import { inBatches, type SiteNow } from './backupImport'
import type { Bean, Brew, Method, Recipe } from './types'

const PAGE_SIZE = 1000
export const BATCH_SIZE = 500

/** Asks for rows page by page until one comes back empty, so a lower row limit can't cut it short. */
export async function readAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<DataResult<T[]>>,
): Promise<DataResult<T[]>> {
  const all: T[] = []
  for (;;) {
    const page = await fetchPage(all.length, all.length + PAGE_SIZE - 1)
    if (!page.ok) return page
    if (page.data.length === 0) return { ok: true, data: all }
    all.push(...page.data)
  }
}

// Ordered so pages don't shift while reading.
function readTable<T>(table: BackupTable, columns: string) {
  const first = table === 'brews' ? 'brewed_at' : 'created_at'
  return readAllPages<T>((from, to) =>
    run<T[]>(
      db()
        .from(table)
        .select(columns)
        .order(first)
        .order('id')
        .range(from, to)
        .overrideTypes<T[], { merge: false }>(),
    ),
  )
}

/** Every row of the four tables, with only the backup's columns (never user_id). */
export async function exportAll(): Promise<
  DataResult<{ methods: Method[]; beans: Bean[]; recipes: Recipe[]; brews: Brew[] }>
> {
  const columns = (table: BackupTable) => BACKUP_COLUMNS[table].join(',')
  const methods = await readTable<Method>('methods', columns('methods'))
  if (!methods.ok) return methods
  const beans = await readTable<Bean>('beans', columns('beans'))
  if (!beans.ok) return beans
  const recipes = await readTable<Recipe>('recipes', columns('recipes'))
  if (!recipes.ok) return recipes
  const brews = await readTable<Brew>('brews', columns('brews'))
  if (!brews.ok) return brews
  return { ok: true, data: { methods: methods.data, beans: beans.data, recipes: recipes.data, brews: brews.data } }
}

/** Just enough of what's on the site to tell what a backup would add. */
export async function readCurrent(): Promise<DataResult<SiteNow>> {
  const methods = await readTable<SiteNow['methods'][number]>('methods', 'id,name')
  if (!methods.ok) return methods
  const beans = await readTable<SiteNow['beans'][number]>('beans', 'id,is_active')
  if (!beans.ok) return beans
  const recipes = await readTable<SiteNow['recipes'][number]>('recipes', 'id,method_id,name')
  if (!recipes.ok) return recipes
  const brews = await readTable<SiteNow['brews'][number]>('brews', 'id')
  if (!brews.ok) return brews
  return { ok: true, data: { methods: methods.data, beans: beans.data, recipes: recipes.data, brews: brews.data } }
}

export type AddResult = { ok: true; done: number } | { ok: false; done: number; error: DataError }

/**
 * Plain insert in batches of 500, each going in whole or not at all. Stops at the first
 * error. A clash is reported, never skipped. user_id is never sent: the database fills it.
 */
export async function addRows<K extends BackupTable>(
  table: K,
  rows: BackupRows[K],
  onProgress: (done: number) => void,
): Promise<AddResult> {
  let done = 0
  for (const batch of inBatches<object>(rows, BATCH_SIZE)) {
    const result = await run<null>(db().from(table).insert(batch))
    if (!result.ok) return { ok: false, done, error: result.error }
    done += batch.length
    onProgress(done)
  }
  return { ok: true, done }
}
