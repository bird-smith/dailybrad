import { useState } from 'react'
import { Link } from 'react-router'
import { LoadFailed, QUIET_LINK, Screen } from '../components/ui'
import { useLoad } from '../lib/useLoad'
import { brewChoices } from './brewSetup'
import { recipeSummary } from './recipeList'
import { loadBrewThings } from './recipesData'
import { daysSinceRoast, roastAgeLabel } from './roastAge'
import type { Bean, Method, Recipe } from './types'

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

      {group && (
        <section className="mt-8">
          <h2 className="text-sm text-muted">Recipe</h2>
          {group.recipes.length === 0 ? (
            <div className="mt-1">
              <p>No recipes for {group.method.name} yet.</p>
              <Link to="/coffee/recipes/new" className={QUIET_LINK}>
                Add recipe
              </Link>
            </div>
          ) : (
            <>
              {!bean && <p className="mt-1">Choose a bean first.</p>}
              <ul className={`mt-1 divide-y divide-line border-y border-line ${bean ? '' : 'opacity-50'}`}>
                {group.recipes.map((recipe) => {
                  const inner = (
                    <>
                      <span className="block truncate font-serif text-xl">{recipe.name}</span>
                      <span className="block text-sm text-muted tabular-nums">{recipeSummary(recipe)}</span>
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
      )}
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
