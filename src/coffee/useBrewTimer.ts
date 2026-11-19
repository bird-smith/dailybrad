import { useEffect, useRef, useState } from 'react'
import { chime, unlockChime } from '../lib/chime'
import { useWakeLock } from '../lib/useWakeLock'
import type { BrewRow } from './brewSetup'
import { advanceTimer, elapsedSeconds, startTimer, tapNext, timerSteps, timerView, type TimerStep } from './brewTimer'

type Running = { startedAtMs: number; steps: TimerStep[]; begun: number[]; totalSeconds: number | null }

const CHECK_EVERY_MS = 250

/**
 * The brew screen's timer. Lives only while the brew screen is open: nothing is stored.
 * `showing`: whether the timer view is on screen (the tone only plays then).
 */
export function useBrewTimer(showing: boolean) {
  const [timer, setTimerState] = useState<Running | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<Running | null>(null)
  const lastElapsed = useRef(0)
  const showingRef = useRef(showing)
  useEffect(() => {
    showingRef.current = showing
  }, [showing])

  const setTimer = (next: Running | null) => {
    timerRef.current = next
    setTimerState(next)
  }

  const running = timer !== null
  const canKeepAwake = useWakeLock(running)

  useEffect(() => {
    if (!running) return
    // Elapsed always comes from the clock, never from counting ticks, so a sleeping phone loses nothing.
    const check = () => {
      const t = timerRef.current
      if (!t) return
      const now = elapsedSeconds(t.startedAtMs, Date.now())
      const begun = advanceTimer(t.steps, t.begun, now)
      const reachedTarget = t.totalSeconds !== null && lastElapsed.current < t.totalSeconds && now >= t.totalSeconds
      lastElapsed.current = now
      if ((begun !== t.begun || reachedTarget) && showingRef.current) chime()
      if (begun !== t.begun) setTimer({ ...t, begun })
      setElapsed(now)
    }
    check()
    const id = setInterval(check, CHECK_EVERY_MS)
    return () => clearInterval(id)
  }, [running])

  /** Starts over from 0:00. The steps are fixed now: changing the dose later doesn't move them. */
  function start(rows: BrewRow[], bloomSeconds: number | null, totalSeconds: number | null) {
    unlockChime()
    const steps = timerSteps(rows, bloomSeconds)
    lastElapsed.current = 0
    setElapsed(0)
    setTimer({ startedAtMs: Date.now(), steps, begun: startTimer(steps), totalSeconds })
  }

  function next() {
    const t = timerRef.current
    if (!t) return
    setTimer({ ...t, begun: tapNext(t.steps, t.begun, elapsedSeconds(t.startedAtMs, Date.now())) })
  }

  /** Stops the timer and returns the seconds since Start. */
  function done(): number {
    const t = timerRef.current
    const seconds = t ? elapsedSeconds(t.startedAtMs, Date.now()) : 0
    setTimer(null)
    return seconds
  }

  const cancel = () => setTimer(null)

  const view = timer ? timerView(timer.steps, timer.begun, elapsed, timer.totalSeconds) : null
  return { running, elapsed, view, canKeepAwake, start, next, done, cancel }
}
