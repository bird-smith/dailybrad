import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type SessionState = 'checking' | 'signed out' | 'signed in'

// Reads the saved sign-in pass on start, then follows every sign-in and sign-out.
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>('checking')

  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setState(data.session ? 'signed in' : 'signed out')
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState(session ? 'signed in' : 'signed out')
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return state
}
