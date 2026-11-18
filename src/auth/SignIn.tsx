import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { signInMessage } from './signInMessage'

const INPUT =
  'mt-1 block h-12 w-full rounded-lg border border-line bg-paper px-3 text-base text-ink ' +
  'outline-none focus:border-accent'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!supabase || busy) return
    setBusy(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setError(signInMessage(error))
    } catch (caught) {
      setError(signInMessage(caught))
    }
    setBusy(false)
  }

  return (
    <main className="screen-in mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-serif text-4xl">Daily Brad</h1>
      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        <label className="block text-sm text-muted">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT}
          />
        </label>
        <label className="block text-sm text-muted">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="press h-16 w-full rounded-xl bg-accent text-lg font-semibold text-on-accent disabled:opacity-70"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {error && (
          <p role="alert" className="text-center text-ink">
            {error}
          </p>
        )}
      </form>
    </main>
  )
}
