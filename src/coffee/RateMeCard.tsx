import { useState } from 'react'
import { useLoad } from '../lib/useLoad'
import { brewDayLabel } from './brewLog'
import { getLatestBrew } from './brewsData'
import { needsRating } from './rating'
import RatingForm from './RatingForm'

// "How was it?" for the newest brew while it has no rating. Shows nothing while loading,
// on failure (the bean card already says the site can't load), or once it's rated.
export default function RateMeCard({ onRated }: { onRated?: () => void }) {
  const { result } = useLoad(getLatestBrew, 'your last brew')
  const [saved, setSaved] = useState(false)

  if (saved) {
    return (
      <p role="status" className="-mt-4 text-muted">
        Rating saved.
      </p>
    )
  }
  if (result.state !== 'loaded' || !result.data || !needsRating(result.data)) return null
  const brew = result.data

  return (
    <section className="w-full rounded-xl border border-line p-4 sm:w-80">
      <h2 className="font-serif text-2xl">How was it?</h2>
      <p className="mt-1 text-sm text-muted tabular-nums">
        {brew.recipe_name} · {brewDayLabel(brew.brewed_at, new Date())}
      </p>
      <div className="mt-3">
        <RatingForm brewId={brew.id} onSaved={() => {
            setSaved(true)
            onRated?.()
          }} />
      </div>
    </section>
  )
}
