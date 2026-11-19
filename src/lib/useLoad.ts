import { useCallback, useEffect, useState, type DependencyList } from 'react'
import { dataMessage, isOnline } from './dataMessage'
import type { DataResult } from './dataResult'

export type Loaded<T> =
  | { state: 'loading' }
  | { state: 'loaded'; data: T }
  | { state: 'failed'; message: string }

// Loads data when a screen opens. what: for the failure sentence, e.g. "your beans".
export function useLoad<T>(load: () => Promise<DataResult<T>>, what: string, deps: DependencyList = []) {
  const [result, setResult] = useState<Loaded<T>>({ state: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let current = true
    load().then((reply) => {
      if (!current) return
      setResult(
        reply.ok
          ? { state: 'loaded', data: reply.data }
          : { state: 'failed', message: dataMessage(reply.error, 'load', isOnline(), what) },
      )
    })
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, ...deps])

  // Reloads quietly: what's on screen stays until the fresh data arrives.
  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  const setData = useCallback((data: T) => setResult({ state: 'loaded', data }), [])

  return { result, reload, setData }
}
