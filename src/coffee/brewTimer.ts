import type { BrewRow } from './brewSetup'

// The guided brew timer's rules. Times are whole seconds since Start.

/**
 * One step on the timer. It starts `at` seconds from Start, or `after` seconds after the
 * step before it began, or (neither) when he taps Next.
 */
export type TimerStep = { row: BrewRow; title: string; at: number | null; after: number | null }

export function timerSteps(rows: BrewRow[], bloomSeconds: number | null): TimerStep[] {
  const firstPour = rows.findIndex((row) => row.kind === 'pour')
  return rows.map((row, i) => {
    const title = row.kind === 'action' ? row.text : i === firstPour && bloomSeconds !== null ? 'Bloom' : 'Pour'
    const afterBloom = bloomSeconds !== null && firstPour >= 0 && i === firstPour + 1 && row.at === null
    return { row, title, at: row.at, after: afterBloom ? bloomSeconds : null }
  })
}

/** When each begun step began. The first step begins at Start. */
export function startTimer(steps: TimerStep[]): number[] {
  return steps.length > 0 ? [0] : []
}

/** When the next step should begin, or null (it waits for a tap, or there is none). */
export function nextStartTime(steps: TimerStep[], begun: number[]): number | null {
  const next = steps[begun.length]
  if (!next || begun.length === 0) return null
  const last = begun[begun.length - 1]
  if (next.at !== null) return Math.max(next.at, last)
  if (next.after !== null) return last + next.after
  return null
}

/** Begins every step whose time has come, each at its own start time (so a slept phone catches up exactly). */
export function advanceTimer(steps: TimerStep[], begun: number[], elapsed: number): number[] {
  let result = begun
  for (let start = nextStartTime(steps, result); start !== null && start <= elapsed; start = nextStartTime(steps, result)) {
    result = [...result, start]
  }
  return result
}

/** Next tapped: the next step begins now. */
export function tapNext(steps: TimerStep[], begun: number[], elapsed: number): number[] {
  return begun.length > 0 && begun.length < steps.length ? [...begun, elapsed] : begun
}

export type TimerView = {
  current: TimerStep | null
  next: TimerStep | null
  /** Seconds until the next step begins by itself, or null. */
  countdown: number | null
  sinceStep: number
  /** On the last step: target minus elapsed (negative is over), or null. */
  toTarget: number | null
}

export function timerView(steps: TimerStep[], begun: number[], elapsed: number, totalSeconds: number | null): TimerView {
  const current = begun.length > 0 ? steps[begun.length - 1] : null
  const next = steps[begun.length] ?? null
  const start = nextStartTime(steps, begun)
  return {
    current,
    next,
    countdown: start === null ? null : Math.max(0, start - elapsed),
    sinceStep: elapsed - (begun.length > 0 ? begun[begun.length - 1] : 0),
    toTarget: next === null && totalSeconds !== null ? totalSeconds - elapsed : null,
  }
}

export function elapsedSeconds(startedAtMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - startedAtMs) / 1000))
}
