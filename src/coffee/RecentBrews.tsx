import { Link } from 'react-router'
import type { DataResult } from '../lib/dataResult'
import { useLoad } from '../lib/useLoad'
import { historyRows, type HistoryRow } from './brewLog'
import { listRecentBrews } from './brewsData'
import RatingDots from './RatingDots'
import { loadMethodsAndRecipes } from './recipesData'

async function loadRecent(): Promise<DataResult<HistoryRow[]>> {
  const [brews, named] = await Promise.all([listRecentBrews(), loadMethodsAndRecipes()])
  if (!brews.ok) return brews
  if (!named.ok) return named
  return { ok: true, data: historyRows(brews.data, [], named.data.methods, named.data.recipes, new Date()) }
}

// The last few brews on home; each opens in History. Shows nothing while loading, on
// failure (the bean card already says the site can't load), or with no brews yet.
export default function RecentBrews() {
  const { result } = useLoad(loadRecent, 'your recent brews')
  if (result.state !== 'loaded' || result.data.length === 0) return null

  return (
    <section className="w-full sm:w-80">
      <h2 className="text-sm tracking-wide text-muted uppercase">Recent brews</h2>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {result.data.map((row) => (
          <li key={row.brew.id}>
            <Link to={`/coffee/history/${row.brew.id}`} className="block min-h-12 py-3">
              <span className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate font-serif text-xl">{row.recipeName}</span>
                {row.brew.rating !== null ? (
                  <RatingDots rating={row.brew.rating} />
                ) : (
                  <span className="shrink-0 text-sm text-muted">Not rated</span>
                )}
              </span>
              <span className="block truncate text-sm text-muted tabular-nums">
                {[row.methodName, row.dayLabel].filter(Boolean).join(' · ')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
