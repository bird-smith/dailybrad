import { Link } from 'react-router'
import ErrorLine from '../components/ErrorLine'
import { useLoad } from '../lib/useLoad'
import { listBeans } from './beansData'
import { daysSinceRoast, roastAgeLabel } from './roastAge'

const CARD = 'press mt-8 block min-h-20 rounded-xl border border-line px-4 py-3'

// The home screen's quiet card: which bag is in use and how fresh it is.
export default function ActiveBeanCard() {
  const { result, reload } = useLoad(listBeans, 'your bean')

  // Loading: keep the space, show nothing, so the screen doesn't jump.
  if (result.state === 'loading') return <div className="mt-8 min-h-20" />

  if (result.state === 'failed') {
    return (
      <div className="mt-8 min-h-20">
        <ErrorLine message="Can't load your bean right now." />
        <button type="button" onClick={reload} className="h-12 text-muted underline underline-offset-4">
          Try again
        </button>
      </div>
    )
  }

  const active = result.data.find((bean) => bean.is_active)
  if (!active) {
    const anyBeans = result.data.length > 0
    return (
      <Link to="/coffee/beans" className={CARD}>
        {anyBeans && <span className="block text-muted">No bean chosen</span>}
        <span className="block font-serif text-xl text-accent">
          {anyBeans ? 'Choose a bean' : 'Add your first bean'}
        </span>
      </Link>
    )
  }

  const age = roastAgeLabel(daysSinceRoast(active.roast_date, new Date()))
  return (
    <Link to="/coffee/beans" className={CARD}>
      <span className="block truncate font-serif text-xl">{active.name}</span>
      {active.roaster && <span className="block truncate text-muted">{active.roaster}</span>}
      {age && <span className="block text-sm text-muted">{age}</span>}
    </Link>
  )
}
