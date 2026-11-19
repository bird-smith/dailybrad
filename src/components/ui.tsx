import { useNavigate } from 'react-router'
import ErrorLine from './ErrorLine'

// Shared looks for screens, so every form and button matches.
export const INPUT =
  'mt-1 block h-12 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink ' +
  'outline-none focus:border-accent'

export const BIG_BUTTON =
  'press flex h-16 w-full items-center justify-center rounded-xl bg-accent text-lg ' +
  'font-semibold text-on-accent disabled:opacity-70'

export const SMALL_BUTTON =
  'press h-12 rounded-lg border border-line px-4 text-ink disabled:opacity-60'

export const QUIET_LINK = 'press flex h-12 items-center text-muted underline underline-offset-4'

// Back to the previous screen; opened straight from an address, go to `fallback` instead.
export function BackButton({ fallback }: { fallback: string }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback))}
      className="press -ml-1 h-12 self-start px-1 text-muted"
    >
      ← Back
    </button>
  )
}

export function Screen({ title, back, children }: { title: string; back: string; children: React.ReactNode }) {
  return (
    <main className="screen-in mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-6 pb-10">
      <BackButton fallback={back} />
      <h1 className="mt-2 font-serif text-4xl">{title}</h1>
      {children}
    </main>
  )
}

// A screen whose list couldn't load: the sentence and Try again.
export function LoadFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-8">
      <ErrorLine message={message} />
      <button type="button" onClick={onRetry} className={QUIET_LINK}>
        Try again
      </button>
    </div>
  )
}
