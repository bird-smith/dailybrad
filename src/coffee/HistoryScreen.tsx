import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import ErrorLine from '../components/ErrorLine'
import { INPUT, LoadFailed, QUIET_LINK, Screen } from '../components/ui'
import { dataMessage, isOnline } from '../lib/dataMessage'
import type { DataResult } from '../lib/dataResult'
import { useLoad } from '../lib/useLoad'
import { splitFinished } from './beanList'
import { listBeans } from './beansData'
import BrewDetails from './BrewDetails'
import { historyRows } from './brewLog'
import { HISTORY_PAGE, listBrews } from './brewsData'
import {
  filterFromParams,
  filterSummary,
  filterToParams,
  isFiltered,
  recipeOptions,
  type HistoryFilter,
} from './historyFilter'
import { listMethods } from './methodsData'
import RatingDots from './RatingDots'
import { formatOneDecimal } from './recipeList'
import { listRecipes } from './recipesData'
import type { Bean, Brew, Method, Recipe } from './types'

export type HistoryData = { brews: Brew[]; more: boolean; beans: Bean[]; methods: Method[]; recipes: Recipe[] }

async function loadHistory(filter: HistoryFilter): Promise<DataResult<HistoryData>> {
  const [brews, beans, methods, recipes] = await Promise.all([
    listBrews(0, filter),
    listBeans(),
    listMethods(),
    listRecipes(),
  ])
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
// loaded. Phone: one or the other. Desktop: side by side. The filter lives in the
// address (?bean=…&method=…&recipe=…), so Back, a refresh and opening a brew keep it.
export default function HistoryScreen() {
  const { brewId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = filterFromParams(searchParams)
  const search = filterToParams(filter).toString()
  const keep = search ? `?${search}` : ''
  const { result, reload, setData } = useLoad(() => loadHistory(filter), 'your brews', [search])
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

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
  const filtered = isFiltered(filter)
  const { inUse, finished } = splitFinished(data.beans)

  function choose(key: keyof HistoryFilter, value: string) {
    setSearchParams(filterToParams({ ...filter, [key]: value || undefined }), { replace: true })
  }
  const clear = () => setSearchParams(new URLSearchParams(), { replace: true })

  async function showOlder() {
    if (loadingMore) return
    setLoadingMore(true)
    setMoreError('')
    const reply = await listBrews(data.brews.length, filter)
    setLoadingMore(false)
    if (!reply.ok) return setMoreError(dataMessage(reply.error, 'load', isOnline(), 'older brews'))
    setData({ ...data, brews: [...data.brews, ...reply.data], more: reply.data.length === HISTORY_PAGE })
  }

  const clearButton = (
    <button type="button" onClick={clear} className={QUIET_LINK}>
      Clear
    </button>
  )

  return (
    <Screen title="History" back={brewId ? `/coffee/history${keep}` : '/coffee'} wide>
      <div className="mt-6 lg:grid lg:grid-cols-2 lg:gap-10">
        <div className={brewId ? 'hidden lg:block' : ''}>
          {!filterOpen && !filtered ? (
            <button type="button" onClick={() => setFilterOpen(true)} className={`${QUIET_LINK} mb-2`}>
              Filter
            </button>
          ) : (
            <div className="mb-4 space-y-2">
              <select aria-label="Bean" value={filter.bean ?? ''} onChange={(e) => choose('bean', e.target.value)} className={INPUT}>
                <option value="">All beans</option>
                {inUse.map((bean) => (
                  <option key={bean.id} value={bean.id}>
                    {bean.name}
                  </option>
                ))}
                {finished.length > 0 && (
                  <optgroup label="Finished bags">
                    {finished.map((bean) => (
                      <option key={bean.id} value={bean.id}>
                        {bean.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <select aria-label="Method" value={filter.method ?? ''} onChange={(e) => choose('method', e.target.value)} className={INPUT}>
                <option value="">All methods</option>
                {data.methods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
              <select aria-label="Recipe" value={filter.recipe ?? ''} onChange={(e) => choose('recipe', e.target.value)} className={INPUT}>
                <option value="">All recipes</option>
                {recipeOptions(data.recipes, data.methods).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {filtered && (
                <div className="flex items-center justify-between gap-4">
                  <p className="min-w-0 truncate text-muted">
                    Showing: {filterSummary(filter, data.beans, data.methods, data.recipes)}
                  </p>
                  {clearButton}
                </div>
              )}
            </div>
          )}

          {rows.length === 0 ? (
            filtered ? (
              <p className="mt-2 text-muted">No brews match.</p>
            ) : (
              <p className="mt-2 text-muted">No brews yet.</p>
            )
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {rows.map((row) => (
                <li key={row.brew.id}>
                  <Link
                    to={`/coffee/history/${row.brew.id}${keep}`}
                    aria-current={row.brew.id === brewId ? 'page' : undefined}
                    className={`block min-h-12 py-3 ${row.brew.id === brewId ? 'text-accent' : ''}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 truncate font-serif text-xl">{row.recipeName}</span>
                      {row.brew.rating !== null && <RatingDots rating={row.brew.rating} />}
                    </span>
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
                navigate(`/coffee/history${keep}`, { replace: true })
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
