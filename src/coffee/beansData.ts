import { db, run } from '../lib/dataResult'
import type { Bean, BeanValues } from './types'

export const listBeans = () => run<Bean[]>(db().from('beans').select('*'))

/** null when no bean has that id (deleted, or a mistyped address). */
export const getBean = (id: string) => run<Bean | null>(db().from('beans').select('*').eq('id', id).maybeSingle())

/** The default bean for brewing, or null when none is chosen. */
export const getActiveBean = () =>
  run<Bean | null>(db().from('beans').select('*').eq('is_active', true).maybeSingle())

export const addBean = (values: BeanValues) => run<Bean>(db().from('beans').insert(values).select('*').single())

export const updateBean = (id: string, values: BeanValues) =>
  run<Bean>(db().from('beans').update(values).eq('id', id).select('*').single())

export const deleteBean = (id: string) => run<null>(db().from('beans').delete().eq('id', id))

/** Makes this bag the active one; the database switches off the old one in the same step. */
export const setActiveBean = (id: string) => run<null>(db().rpc('set_active_bean', { bean_id: id }))

/** Finishing a bag also stops it being the active one. */
export const setFinished = (id: string, finished: boolean) =>
  run<null>(
    db()
      .from('beans')
      .update(finished ? { finished: true, is_active: false } : { finished: false })
      .eq('id', id),
  )
