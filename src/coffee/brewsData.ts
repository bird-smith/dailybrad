import { db, run } from '../lib/dataResult'
import type { BrewFix } from './brewLog'
import type { Brew, BrewValues } from './types'

export const HISTORY_PAGE = 50

/** 50 brews, newest first, starting at offset. */
export const listBrews = (offset: number) =>
  run<Brew[]>(
    db()
      .from('brews')
      .select('*')
      .order('brewed_at', { ascending: false })
      .range(offset, offset + HISTORY_PAGE - 1),
  )

/** null when no brew has that id. */
export const getBrew = (id: string) => run<Brew | null>(db().from('brews').select('*').eq('id', id).maybeSingle())

export const addBrew = (values: BrewValues) => run<Brew>(db().from('brews').insert(values).select('*').single())

export const updateBrew = (id: string, changes: BrewFix) =>
  run<Brew>(db().from('brews').update(changes).eq('id', id).select('*').single())

export const deleteBrew = (id: string) => run<null>(db().from('brews').delete().eq('id', id))
