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

/** One item in a recipe's ordered list. percent: share of the total water. at: seconds. */
export type RecipeStep =
  | { kind: 'pour'; percent: number; at: number | null }
  | { kind: 'action'; text: string; at: number | null }

// Written by hand to match supabase/migrations/003-recipes.sql.
export type Recipe = {
  id: string
  method_id: string
  name: string
  ratio: number
  dose_grams: number
  grinder: string | null
  grind_size: string | null
  temperature: number | null
  bloom_seconds: number | null
  total_seconds: number | null
  steps: RecipeStep[]
  notes: string | null
  created_at: string
}

export type RecipeValues = Omit<Recipe, 'id' | 'created_at'>

// Written by hand to match supabase/migrations/004-brews.sql.
export type Brew = {
  id: string
  brewed_at: string
  bean_id: string
  method_id: string
  /** null once the recipe is deleted; recipe_name keeps what it was called. */
  recipe_id: string | null
  recipe_name: string
  dose_grams: number
  ratio: number
  grinder: string | null
  grind_size: string | null
  temperature: number | null
  bloom_seconds: number | null
  brew_seconds: number | null
  steps: RecipeStep[]
}

export type BrewValues = Omit<Brew, 'id' | 'brewed_at'>

/** The parts of a bean he types in. */
export type BeanValues = Omit<Bean, 'id' | 'finished' | 'is_active' | 'created_at'>
