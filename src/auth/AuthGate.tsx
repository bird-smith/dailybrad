import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useSession } from './useSession'
import SignIn from './SignIn'

// Shows the site only once signed in. Belongs to the whole site, not one section.
export default function AuthGate({ children }: { children: ReactNode }) {
  const state = useSession()

  if (!supabase) {
    return (
      <main className="screen-in mx-auto flex min-h-dvh max-w-md items-center px-4">
        <p className="text-muted">This site isn't connected to its database yet.</p>
      </main>
    )
  }
  if (state === 'checking') return null
  if (state === 'signed out') return <SignIn />
  return <>{children}</>
}
