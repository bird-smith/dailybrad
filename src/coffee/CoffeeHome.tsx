import { Link } from 'react-router'
import { supabase } from '../lib/supabase'
import ActiveBeanCard from './ActiveBeanCard'

const LINKS = [
  { to: '/coffee/beans', label: 'Beans' },
  { to: '/coffee/recipes', label: 'Recipes' },
  { to: '/coffee/history', label: 'History' },
]

const TODAY_FORMAT: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }

export default function CoffeeHome() {
  const today = new Date().toLocaleDateString('en-US', TODAY_FORMAT)

  return (
    <main className="screen-in mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-16 pb-6">
      <header>
        <h1 className="font-serif text-4xl">Coffee</h1>
        <p className="mt-1 text-muted">{today}</p>
        <ActiveBeanCard />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
        <Link
          to="/coffee/brew"
          className="press flex h-16 w-full items-center justify-center rounded-xl bg-accent text-xl font-semibold text-on-accent sm:w-72"
        >
          Brew
        </Link>
        <nav className="flex items-center gap-2 text-muted">
          {LINKS.map((link, i) => (
            <span key={link.to} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">·</span>}
              <Link to={link.to} className="flex h-12 items-center px-2 hover:text-ink">
                {link.label}
              </Link>
            </span>
          ))}
        </nav>
      </div>

      <button
        type="button"
        // This device only: signing out here leaves his other devices signed in.
        onClick={() => supabase?.auth.signOut({ scope: 'local' })}
        className="h-12 self-center px-4 text-sm text-muted hover:text-ink"
      >
        Sign out
      </button>
    </main>
  )
}
