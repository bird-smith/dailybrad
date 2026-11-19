import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import ErrorLine from '../components/ErrorLine'
import { LoadFailed, QUIET_LINK, Screen } from '../components/ui'
import { dataMessage, isOnline } from '../lib/dataMessage'
import type { DataResult } from '../lib/dataResult'
import { useLoad } from '../lib/useLoad'
import { listBeans } from './beansData'
import BrewDetails from './BrewDetails'
import { historyRows } from './brewLog'
import { HISTORY_PAGE, listBrews } from './brewsData'
import { listMethods } from './methodsData'
import { formatOneDecimal } from './recipeList'
import { listRecipes } from './recipesData'
import type { Bean, Brew, Method, Recipe } from './types'

export type HistoryData = { brews: Brew[]; more: boolean; beans: Bean[]; methods: Method[]; recipes: Recipe[] }

async function loadHistory(): Promise<DataResult<HistoryData>> {
  const [brews, beans, methods, recipes] = await Promise.all([listBrews(0), listBeans(), listMethods(), listRecipes()])
  if (!brews.ok) return brews
  if (!beans.ok) return beans
  if (!methods.ok) return methods
  if (!recipes.ok) return recipes
  return {
    ok: true,
    data: {
      brews: brews.data,
      more: brews.data.length === HISTORY_PAGE,
      beans: beans.data,
      methods: methods.data,
      recipes: recipes.data,
    },
  }
}

// One route for the list and a chosen brew (#/coffee/history/<id>), so the list stays
// loaded. Phone: one or the other. Desktop: side by side.
export default function HistoryScreen() {
  const { brewId } = useParams()
  const navigate = useNavigate()
  const { result, reload, setData } = useLoad(loadHistory, 'your brews')
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState('')

  if (result.state !== 'loaded') {
    return (
      <Screen title="History" back="/coffee" wide>
        {result.state === 'failed' && <LoadFailed message={result.message} onRetry={reload} />}
      </Screen>
    )
  }

  const data = result.data
  const rows = historyRows(data.brews, data.beans, data.methods, data.recipes, new Date())
  const chosen = data.brews.find((b) => b.id === brewId) ?? null

  async function showOlder() {
    if (loadingMore) return
    setLoadingMore(true)
    setMoreError('')
    const reply = await listBrews(data.brews.length)
    setLoadingMore(false)
    if (!reply.ok) return setMoreError(dataMessage(reply.error, 'load', isOnline(), 'older brews'))
    setData({ ...data, brews: [...data.brews, ...reply.data], more: reply.data.length === HISTORY_PAGE })
  }

  return (
    <Screen title="History" back={brewId ? '/coffee/history' : '/coffee'} wide>
      <div className="mt-6 lg:grid lg:grid-cols-2 lg:gap-10">
        <div className={brewId ? 'hidden lg:block' : ''}>
          {rows.length === 0 ? (
            <p className="mt-2 text-muted">No brews yet.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {rows.map((row) => (
                <li key={row.brew.id}>
                  <Link
                    to={`/coffee/history/${row.brew.id}`}
                    aria-current={row.brew.id === brewId ? 'page' : undefined}
                    className={`block min-h-12 py-3 ${row.brew.id === brewId ? 'text-accent' : ''}`}
                  >
                    <span className="block truncate font-serif text-xl">{row.recipeName}</span>
                    <span className="block truncate text-sm text-muted tabular-nums">
                      {[row.dayLabel, row.methodName, row.beanName, `${formatOneDecimal(row.brew.dose_grams)} g`]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {data.more && (
            <button type="button" disabled={loadingMore} onClick={showOlder} className={QUIET_LINK}>
              {loadingMore ? 'Loading…' : 'Show older brews'}
            </button>
          )}
          <ErrorLine message={moreError} />
        </div>

        <div className={brewId ? '' : 'hidden lg:block'}>
          {brewId ? (
            <BrewDetails
              key={brewId}
              brewId={brewId}
              brew={chosen}
              data={data}
              onChanged={(brew) => setData({ ...data, brews: data.brews.map((b) => (b.id === brew.id ? brew : b)) })}
              onDeleted={() => {
                setData({ ...data, brews: data.brews.filter((b) => b.id !== brewId) })
                navigate('/coffee/history', { replace: true })
              }}
            />
          ) : (
            <p className="text-muted">Choose a brew.</p>
          )}
        </div>
      </div>
    </Screen>
  )
}
