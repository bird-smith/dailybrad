import { db, run } from '../lib/dataResult'
import type { BrewFix } from './brewLog'
import type { HistoryFilter } from './historyFilter'
import type { Brew, BrewValues, RatingValues } from './types'

export const HISTORY_PAGE = 50

/** 50 brews, newest first, starting at offset, within the filter. */
export function listBrews(offset: number, filter: HistoryFilter = {}) {
  let query = db().from('brews').select('*')
  if (filter.bean) query = query.eq('bean_id', filter.bean)
  if (filter.method) query = query.eq('method_id', filter.method)
  if (filter.recipe) query = query.eq('recipe_id', filter.recipe)
  return run<Brew[]>(query.order('brewed_at', { ascending: false }).range(offset, offset + HISTORY_PAGE - 1))
}

/** null when no brew has that id. */
export const getBrew = (id: string) => run<Brew | null>(db().from('brews').select('*').eq('id', id).maybeSingle())

export type LatestBrew = Pick<Brew, 'id' | 'brewed_at' | 'recipe_name'> & RatingValues

/** The newest brew only, or null with no brews yet. */
export const getLatestBrew = () =>
  run<LatestBrew | null>(
    db()
      .from('brews')
      .select('id, brewed_at, recipe_name, rating, taste_words, rating_note')
      .order('brewed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  )

export const addBrew = (values: BrewValues) => run<Brew>(db().from('brews').insert(values).select('*').single())

export const updateBrew = (id: string, changes: BrewFix) =>
  run<Brew>(db().from('brews').update(changes).eq('id', id).select('*').single())

/** Only the rating columns. An empty list back means the brew has gone. */
export const rateBrew = (id: string, values: RatingValues) =>
  run<{ id: string }[]>(
    db()
      .from('brews')
      .update({ rating: values.rating, taste_words: values.taste_words, rating_note: values.rating_note })
      .eq('id', id)
      .select('id'),
  )

export const deleteBrew = (id: string) => run<null>(db().from('brews').delete().eq('id', id))
