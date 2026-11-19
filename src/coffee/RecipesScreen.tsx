import { Link } from 'react-router'
import { BIG_BUTTON, LoadFailed, QUIET_LINK, Screen } from '../components/ui'
import { useLoad } from '../lib/useLoad'
import { groupRecipes, recipeSummary } from './recipeList'
import { loadMethodsAndRecipes } from './recipesData'

export default function RecipesScreen() {
  const { result, reload } = useLoad(loadMethodsAndRecipes, 'your recipes')

  return (
    <Screen title="Recipes" back="/coffee">
      {result.state === 'failed' && <LoadFailed message={result.message} onRetry={reload} />}

      {result.state === 'loaded' && result.data.methods.length === 0 && (
        <div className="mt-8">
          <p className="text-muted">Add a brewing method first.</p>
          <Link to="/coffee/methods" className={QUIET_LINK}>
            Brewing methods
          </Link>
        </div>
      )}

      {result.state === 'loaded' && result.data.methods.length > 0 && (
        <>
          <Link to="/coffee/recipes/new" className={`${BIG_BUTTON} mt-8`}>
            Add recipe
          </Link>
          {groupRecipes(result.data.methods, result.data.recipes).map(({ method, recipes }) => (
            <section key={method.id} className="mt-8">
              <h2 className="text-sm tracking-wide text-muted uppercase">{method.name}</h2>
              {recipes.length === 0 ? (
                <p className="mt-2 text-muted">No recipes yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-line border-y border-line">
                  {recipes.map((recipe) => (
                    <li key={recipe.id}>
                      <Link to={`/coffee/recipes/${recipe.id}`} className="block min-h-12 py-3">
                        <span className="block truncate font-serif text-xl">{recipe.name}</span>
                        <span className="block text-sm text-muted tabular-nums">{recipeSummary(recipe)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </>
      )}
    </Screen>
  )
}
