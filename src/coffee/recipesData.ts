import { db, run, type DataResult } from '../lib/dataResult'
import { listMethods } from './methodsData'
import type { Method, Recipe, RecipeValues } from './types'

export const listRecipes = () => run<Recipe[]>(db().from('recipes').select('*'))

/** null when no recipe has that id. */
export const getRecipe = (id: string) =>
  run<Recipe | null>(db().from('recipes').select('*').eq('id', id).maybeSingle())

export const addRecipe = (values: RecipeValues) =>
  run<Recipe>(db().from('recipes').insert(values).select('*').single())

export const updateRecipe = (id: string, values: RecipeValues) =>
  run<Recipe>(db().from('recipes').update(values).eq('id', id).select('*').single())

export const deleteRecipe = (id: string) => run<null>(db().from('recipes').delete().eq('id', id))

/** Methods and recipes together, for any screen that needs both. */
export async function loadMethodsAndRecipes(): Promise<DataResult<{ methods: Method[]; recipes: Recipe[] }>> {
  const [methods, recipes] = await Promise.all([listMethods(), listRecipes()])
  if (!methods.ok) return methods
  if (!recipes.ok) return recipes
  return { ok: true, data: { methods: methods.data, recipes: recipes.data } }
}
