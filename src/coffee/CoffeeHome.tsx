import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { supabase } from '../lib/supabase'
import ActiveBeanCard from './ActiveBeanCard'
import RateMeCard from './RateMeCard'
import RecentBrews from './RecentBrews'

const LINKS = [
  { to: '/coffee/methods', label: 'Methods' },
  { to: '/coffee/recipes', label: 'Recipes' },
  { to: '/coffee/beans', label: 'Beans' },
  { to: '/coffee/history', label: 'History' },
]

const TODAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }

export default function CoffeeHome() {
  const today = new Date().toLocaleDateString('en-US', TODAY_FORMAT)
  const location = useLocation()
  const navigate = useNavigate()
  // Shown once after saving a brew; the note is cleared at once so a reload doesn't repeat it.
  const [brewSaved] = useState(Boolean((location.state as { brewSaved?: boolean } | null)?.brewSaved))
  useEffect(() => {
    if (brewSaved) navigate('.', { replace: true, state: null })
  }, [brewSaved, navigate])
  // Bumped when the "How was it?" card saves a rating, so the recent list reloads its dots.
  const [ratedCount, setRatedCount] = useState(0)

  return (
    <main className="screen-in mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-16 pb-6">
      <header>
        <h1 className="font-serif text-4xl">Coffee</h1>
        <p className="mt-1 text-muted">{today}</p>
        <ActiveBeanCard />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
        <RateMeCard onRated={() => setRatedCount((n) => n + 1)} />
        <RecentBrews key={ratedCount} />
      </div>

      <div className="flex flex-col items-center gap-6 pb-4">
        <Link
          to="/coffee/brew"
          className="press flex h-16 w-full items-center justify-center rounded-xl bg-accent text-xl font-semibold text-on-accent sm:w-72"
        >
          Brew
        </Link>
        {brewSaved && (
          <p role="status" className="-mt-4 text-muted">
            Brew saved.
          </p>
        )}
        <nav className="flex flex-wrap items-center justify-center gap-1 text-muted">
          {LINKS.map((link, i) => (
            <span key={link.to} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">·</span>}
              <Link to={link.to} className="flex h-12 items-center px-2 hover:text-ink">
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-1 self-center text-sm text-muted">
        <Link to="/coffee/backup" className="flex h-12 items-center px-3 hover:text-ink">
          Backup
        </Link>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          // This device only: signing out here leaves his other devices signed in.
          onClick={() => supabase?.auth.signOut({ scope: 'local' })}
          className="h-12 px-3 hover:text-ink"
        >
          Sign out
        </button>
      </div>
    </main>
  )
}
