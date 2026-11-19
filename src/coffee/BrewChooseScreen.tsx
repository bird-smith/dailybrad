import { useState } from 'react'
import { Link } from 'react-router'
import ErrorLine from '../components/ErrorLine'
import { LoadFailed, QUIET_LINK, Screen } from '../components/ui'
import type { DataResult } from '../lib/dataResult'
import { useLoad } from '../lib/useLoad'
import { brewChoices } from './brewSetup'
import { getLatestBrewForMethod, getRecipeRatings } from './brewsData'
import { recipeSummary } from './recipeList'
import { loadBrewThings } from './recipesData'
import { rankRecipes, ratingLine, recommendedId, repeatChoice } from './recommendations'
import RepeatCard from './RepeatCard'
import { daysSinceRoast, roastAgeLabel } from './roastAge'
import type { Bean, Brew, Method, Recipe, RecipeRating } from './types'

export default function BrewChooseScreen() {
  const { result, reload } = useLoad(loadBrewThings, 'your coffee things')
  return (
    <Screen title="Brew" back="/coffee">
      {result.state === 'failed' && <LoadFailed message={result.message} onRetry={reload} />}
      {result.state === 'loaded' && <Choices {...result.data} />}
    </Screen>
  )
}

function Choices({ methods, beans, recipes }: { methods: Method[]; beans: Bean[]; recipes: Recipe[] }) {
  const choices = brewChoices(methods, beans, recipes)
  // Picking a bag here is for this brew only; the active bean stays as it is.
  const [beanId, setBeanId] = useState(choices.defaultBeanId)
  const [picking, setPicking] = useState(choices.defaultBeanId === null)
  const [methodId, setMethodId] = useState(choices.defaultMethodId)
  const bean = choices.bags.find((b) => b.id === beanId) ?? null
  const group = choices.groups.find((g) => g.method.id === methodId)

  return (
    <>
      <section className="mt-8">
        <h2 className="text-sm text-muted">Bean</h2>
        {choices.bags.length === 0 ? (
          <div className="mt-1">
            <p>Add a bean first.</p>
            <Link to="/coffee/beans/new" className={QUIET_LINK}>
              Add bean
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-1 flex min-h-12 items-center gap-3">
              {bean ? <BeanLabel bean={bean} /> : <span className="flex-1 text-muted">No bean chosen</span>}
              {!picking && (
                <button type="button" onClick={() => setPicking(true)} className="h-12 px-2 text-muted underline underline-offset-4">
                  Change
                </button>
              )}
            </div>
            {picking && (
              <ul className="mt-2 divide-y divide-line border-y border-line">
                {choices.bags.map((bag) => (
                  <li key={bag.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setBeanId(bag.id)
                        setPicking(false)
                      }}
                      className="flex min-h-12 w-full items-center py-2 text-left"
                    >
                      <BeanLabel bean={bag} />
                      {bag.id === beanId && <span className="text-accent">✓</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm text-muted">Method</h2>
        {methods.length === 0 ? (
          <div className="mt-1">
            <p>Add a brewing method first.</p>
            <Link to="/coffee/methods" className={QUIET_LINK}>
              Brewing methods
            </Link>
          </div>
        ) : (
          <div className="mt-1 flex flex-wrap gap-2">
            {methods.map((method) => (
              <button
                key={method.id}
                type="button"
                aria-pressed={methodId === method.id}
                onClick={() => setMethodId(method.id)}
                className={`press h-12 rounded-lg border px-4 ${
                  methodId === method.id ? 'border-accent bg-accent text-on-accent' : 'border-line text-ink'
                }`}
              >
                {method.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {group &&
        (group.recipes.length === 0 ? (
          <section className="mt-8">
            <h2 className="text-sm text-muted">Recipe</h2>
            <div className="mt-1">
              <p>No recipes for {group.method.name} yet.</p>
              <Link to="/coffee/recipes/new" className={QUIET_LINK}>
                Add recipe
              </Link>
            </div>
          </section>
        ) : (
          // Keyed by method, so a new method shows "Loading…" rather than the last one's ranking.
          <MethodRecipes key={group.method.id} methodId={group.method.id} recipes={group.recipes} bean={bean} />
        ))}
    </>
  )
}

type Suggestions = { latest: Brew | null; ratings: RecipeRating[] }

async function loadSuggestions(methodId: string, beanId: string | null): Promise<DataResult<Suggestions>> {
  const [latest, ratings] = await Promise.all([getLatestBrewForMethod(methodId), getRecipeRatings(methodId, beanId)])
  if (!latest.ok) return latest
  if (!ratings.ok) return ratings
  return { ok: true, data: { latest: latest.data, ratings: ratings.data } }
}

// The Repeat card, then recipes ranked by rating. If the ranking can't load, the recipes
// stay A to Z and tappable: brewing is never blocked by it.
function MethodRecipes({ methodId, recipes, bean }: { methodId: string; recipes: Recipe[]; bean: Bean | null }) {
  const beanId = bean?.id ?? null
  const { result, reload } = useLoad(() => loadSuggestions(methodId, beanId), 'ratings', [methodId, beanId])
  const data = result.state === 'loaded' ? result.data : null
  const ranked = data ? rankRecipes(recipes, data.ratings) : null
  const recommended = ranked ? recommendedId(ranked) : null
  const rows = ranked
    ? ranked.map((row) => ({ recipe: row.recipe, line: ratingLine(row) }))
    : recipes.map((recipe) => ({ recipe, line: null }))
  const repeat = data ? repeatChoice(data.latest, recipes) : null
  const repeatName = recipes.find((r) => r.id === repeat?.recipe_id)?.name ?? ''

  return (
    <>
      {repeat && <RepeatCard brew={repeat} recipeName={repeatName} beanId={beanId} />}
      <section className="mt-8">
        <h2 className="text-sm text-muted">Recipe</h2>
        {result.state === 'loading' ? (
          <p className="mt-1 text-muted">Loading…</p>
        ) : (
          <>
            {result.state === 'failed' && (
              <div className="mt-1">
                <ErrorLine message={result.message} />
                <button type="button" onClick={reload} className={QUIET_LINK}>
                  Try again
                </button>
              </div>
            )}
            {!bean && <p className="mt-1">Choose a bean first.</p>}
            <ul className={`mt-1 divide-y divide-line border-y border-line ${bean ? '' : 'opacity-50'}`}>
              {rows.map(({ recipe, line }) => {
                const inner = (
                  <>
                    {recipe.id === recommended && <span className="block text-sm text-accent">Recommended</span>}
                    <span className="block truncate font-serif text-xl">{recipe.name}</span>
                    <span className="block text-sm text-muted tabular-nums">{recipeSummary(recipe)}</span>
                    {line && <span className="block text-sm text-muted tabular-nums">{line}</span>}
                  </>
                )
                return (
                  <li key={recipe.id}>
                    {bean ? (
                      <Link to={`/coffee/brew/${recipe.id}/${bean.id}`} className="block min-h-12 py-3">
                        {inner}
                      </Link>
                    ) : (
                      <div className="min-h-12 py-3">{inner}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>
    </>
  )
}

function BeanLabel({ bean }: { bean: Bean }) {
  const age = roastAgeLabel(daysSinceRoast(bean.roast_date, new Date()))
  return (
    <span className="min-w-0 flex-1">
      <span className="block truncate font-serif text-xl">{bean.name}</span>
      {age && <span className="block text-sm text-muted">{age}</span>}
    </span>
  )
}
