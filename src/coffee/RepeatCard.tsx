import { Link } from 'react-router'
import RatingDots from './RatingDots'
import { repeatSummary } from './recommendations'
import type { Brew } from './types'

// "Repeat last brew": opens the brew screen set up as that brew, with the chosen bag.
// Greyed and not a link while no bag is chosen.
export default function RepeatCard({ brew, recipeName, beanId }: { brew: Brew; recipeName: string; beanId: string | null }) {
  const inner = (
    <>
      <span className="block text-sm text-muted">Repeat last brew</span>
      <span className="block truncate font-serif text-xl">{recipeName}</span>
      <span className="flex items-center gap-3 text-sm text-muted tabular-nums">
        <span className="min-w-0 truncate">{repeatSummary(brew, new Date())}</span>
        {brew.rating !== null && <RatingDots rating={brew.rating} />}
      </span>
    </>
  )
  const box = 'mt-8 block min-h-14 rounded-xl border border-line px-4 py-3'
  return beanId ? (
    <Link to={`/coffee/brew/${brew.recipe_id}/${beanId}/${brew.id}`} className={`press ${box}`}>
      {inner}
    </Link>
  ) : (
    <div className={`${box} opacity-50`}>{inner}</div>
  )
}
