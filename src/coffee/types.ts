// Written by hand to match supabase/migrations/002-methods-and-beans.sql.

export type Method = {
  id: string
  name: string
  created_at: string
}

export type Bean = {
  id: string
  name: string
  roaster: string | null
  /** YYYY-MM-DD */
  roast_date: string | null
  bag_grams: number | null
  cost_cents: number | null
  region: string | null
  varietal: string | null
  notes: string | null
  finished: boolean
  is_active: boolean
  created_at: string
}

/** The parts of a bean he types in. */
export type BeanValues = Omit<Bean, 'id' | 'finished' | 'is_active' | 'created_at'>
