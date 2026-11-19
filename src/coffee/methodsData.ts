import { db, run } from '../lib/dataResult'
import type { Method } from './types'

const COLUMNS = 'id, name, created_at'

export const listMethods = () =>
  run<Method[]>(db().from('methods').select(COLUMNS).order('created_at'))

export const addMethod = (name: string) =>
  run<Method>(db().from('methods').insert({ name }).select(COLUMNS).single())

export const renameMethod = (id: string, name: string) =>
  run<Method>(db().from('methods').update({ name }).eq('id', id).select(COLUMNS).single())

export const removeMethod = (id: string) => run<null>(db().from('methods').delete().eq('id', id))

/** The database's "already exists" error: another device added the same name. */
export const isDuplicate = (error: { code?: string }) => error.code === '23505'
