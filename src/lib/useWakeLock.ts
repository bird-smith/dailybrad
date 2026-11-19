import { useEffect } from 'react'

const SUPPORTED = typeof navigator !== 'undefined' && 'wakeLock' in navigator

/**
 * Keeps the screen on while `on` is true. Returns whether this browser can do it.
 * Failures are ignored: whatever needed the screen keeps working, it may just dim.
 */
export function useWakeLock(on: boolean): boolean {
  useEffect(() => {
    if (!on || !SUPPORTED) return
    let lock: WakeLockSentinel | null = null
    let ended = false

    const request = () => {
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          if (ended) void sentinel.release().catch(() => {})
          else lock = sentinel
        })
        .catch(() => {})
    }
    // The browser drops the lock when the page is hidden; ask again on return.
    const onVisible = () => {
      if (document.visibilityState === 'visible') request()
    }

    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      ended = true
      document.removeEventListener('visibilitychange', onVisible)
      void lock?.release().catch(() => {})
    }
  }, [on])

  return SUPPORTED
}
