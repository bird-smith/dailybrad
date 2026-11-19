import { useState } from 'react'
import { Link } from 'react-router'
import ErrorLine from '../components/ErrorLine'
import { BIG_BUTTON, LoadFailed, QUIET_LINK, Screen, SMALL_BUTTON } from '../components/ui'
import { dataMessage, isOnline } from '../lib/dataMessage'
import { useLoad } from '../lib/useLoad'
import { splitFinished } from './beanList'
import { getBeanSupply, listBeans, setActiveBean } from './beansData'
import { supplyLine, toTenths } from './beanSupply'
import { getLatestBrew } from './brewsData'
import { daysSinceRoast, roastAgeLabel } from './roastAge'
import type { Bean, BeanSupply } from './types'

// The sums for "cups left": loaded apart from the list, so a failed sum never hides the bags.
async function loadSupply() {
  const [supply, latest] = await Promise.all([getBeanSupply(), getLatestBrew()])
  if (!supply.ok) return supply
  if (!latest.ok) return latest
  const latestDose = latest.data ? toTenths(latest.data.dose_grams) : null
  return { ok: true as const, data: { supply: supply.data, latestDose } }
}

export default function BeansScreen() {
  const { result, reload } = useLoad(listBeans, 'your beans')
  const supply = useLoad(loadSupply, 'cups left')
  const [showFinished, setShowFinished] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function use(id: string) {
    if (switching) return
    setSwitching(id)
    setError('')
    const reply = await setActiveBean(id)
    if (!reply.ok) setError(dataMessage(reply.error, 'save', isOnline()))
    setSwitching(null)
    reload()
  }

  const { inUse, finished } = splitFinished(result.state === 'loaded' ? result.data : [])

  return (
    <Screen title="Beans" back="/coffee">
      <Link to="/coffee/beans/new" className={`${BIG_BUTTON} mt-8`}>
        Add bean
      </Link>

      {result.state === 'failed' && <LoadFailed message={result.message} onRetry={reload} />}
      <ErrorLine message={error} className="mt-4" />

      {result.state === 'loaded' && (
        <>
          {inUse.length > 0 && (
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {inUse.map((bean) => (
                <li key={bean.id} className="flex items-center gap-3 py-3">
                  <BeanName bean={bean} supply={supply.result.state === 'loaded' ? supply.result.data : null} />
                  {bean.is_active ? (
                    <span className="px-2 font-semibold text-accent">Active</span>
                  ) : (
                    <button
                      type="button"
                      disabled={switching !== null}
                      onClick={() => use(bean.id)}
                      className={SMALL_BUTTON}
                    >
                      {switching === bean.id ? '…' : 'Use'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {supply.result.state === 'failed' && (
            <div className="mt-4 text-sm">
              <ErrorLine message={supply.result.message} />
              <button type="button" onClick={supply.reload} className={QUIET_LINK}>
                Try again
              </button>
            </div>
          )}

          {finished.length > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowFinished(!showFinished)}
                aria-expanded={showFinished}
                className="h-12 text-muted"
              >
                {showFinished ? '▾' : '▸'} Finished bags ({finished.length})
              </button>
              {showFinished && (
                <ul className="divide-y divide-line border-y border-line opacity-60">
                  {finished.map((bean) => (
                    <li key={bean.id} className="py-3">
                      <BeanName bean={bean} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <Link to="/coffee/methods" className={`${QUIET_LINK} mt-auto self-center pt-10`}>
        Brewing methods
      </Link>
    </Screen>
  )
}

type Supply = { supply: BeanSupply[]; latestDose: number | null }

function BeanName({ bean, supply = null }: { bean: Bean; supply?: Supply | null }) {
  const age = roastAgeLabel(daysSinceRoast(bean.roast_date, new Date()))
  const detail = [bean.roaster, age].filter(Boolean).join(' · ')
  const left = supply && supplyLine(bean, supply.supply, supply.latestDose)
  return (
    <Link to={`/coffee/beans/${bean.id}`} className="block min-h-12 min-w-0 flex-1">
      <span className="block truncate font-serif text-xl">{bean.name}</span>
      {detail && <span className="block truncate text-sm text-muted">{detail}</span>}
      {left && <span className="block truncate text-sm text-muted tabular-nums">{left}</span>}
    </Link>
  )
}
