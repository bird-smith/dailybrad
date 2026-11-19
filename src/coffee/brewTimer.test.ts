import { describe, expect, it } from 'vitest'
import type { BrewRow } from './brewSetup'
import {
  advanceTimer,
  elapsedSeconds,
  nextStartTime,
  startTimer,
  tapNext,
  timerSteps,
  timerView,
} from './brewTimer'

// The worked example: 18 g at 1:15 (270 g water), pours 10, 40, 50 % (to 27, 135, 270),
// bloom 0:45, target 3:00, "Open the valve" at 2:00 between the second and third pour.
const pour = (pourTo: number, amount: number, at: number | null = null): BrewRow => ({ kind: 'pour', pourTo, amount, at })
const action = (text: string, at: number | null = null): BrewRow => ({ kind: 'action', text, at })
const ROWS: BrewRow[] = [pour(27, 27), pour(135, 108), action('Open the valve', 120), pour(270, 135)]
const STEPS = timerSteps(ROWS, 45)

describe('timerSteps', () => {
  it('titles the first pour Bloom when a bloom is set, Pour otherwise', () => {
    expect(STEPS[0]).toMatchObject({ title: 'Bloom', row: { pourTo: 27, amount: 27 } })
    expect(timerSteps(ROWS, null)[0].title).toBe('Pour')
    expect(STEPS[1].title).toBe('Pour')
  })

  it('starts the row after the bloom pour after the bloom, unless it has its own time', () => {
    expect(STEPS[1]).toMatchObject({ at: null, after: 45 })
    const withAt = timerSteps([pour(27, 27), pour(135, 108, 50)], 45)
    expect(withAt[1]).toMatchObject({ at: 50, after: null })
  })

  it('keeps action text and times; a pour with no time has neither', () => {
    expect(STEPS[2]).toMatchObject({ title: 'Open the valve', at: 120, after: null })
    expect(STEPS[3]).toMatchObject({ at: null, after: null })
  })

  it('puts the bloom on the first pour even after an action', () => {
    const steps = timerSteps([action('Close the valve'), pour(27, 27), pour(135, 108)], 45)
    expect(steps.map((s) => s.title)).toEqual(['Close the valve', 'Bloom', 'Pour'])
    expect(steps[2].after).toBe(45)
    expect(steps[1].after).toBeNull()
  })

  it('gives no steps for no rows', () => {
    expect(timerSteps([], 45)).toEqual([])
  })
})

describe('startTimer', () => {
  it('begins the first step at Start, whatever its time', () => {
    expect(startTimer(STEPS)).toEqual([0])
    expect(startTimer(timerSteps([pour(27, 27, 10)], null))).toEqual([0])
    expect(startTimer([])).toEqual([])
  })
})

describe('nextStartTime', () => {
  it('uses at, or last begun plus after, or waits', () => {
    expect(nextStartTime(STEPS, [0, 45])).toBe(120)
    expect(nextStartTime(STEPS, [0])).toBe(45)
    expect(nextStartTime(STEPS, [0, 45, 120])).toBeNull()
    expect(nextStartTime(STEPS, [0, 45, 120, 150])).toBeNull()
  })

  it('never schedules a step before the one already begun', () => {
    expect(nextStartTime(STEPS, [0, 130])).toBe(130)
  })
})

describe('advanceTimer', () => {
  it('moves on when the bloom is over', () => {
    const begun = [0]
    expect(advanceTimer(STEPS, begun, 44)).toBe(begun)
    expect(advanceTimer(STEPS, begun, 45)).toEqual([0, 45])
  })

  it('moves to a timed step, then waits for a tap', () => {
    expect(advanceTimer(STEPS, [0, 45], 119)).toEqual([0, 45])
    expect(advanceTimer(STEPS, [0, 45], 120)).toEqual([0, 45, 120])
    expect(advanceTimer(STEPS, [0, 45], 500)).toEqual([0, 45, 120])
  })

  it('catches up several steps at their own start times', () => {
    expect(advanceTimer(STEPS, [0], 130)).toEqual([0, 45, 120])
  })

  it('returns the same list when nothing changed', () => {
    const begun = [0, 45, 120]
    expect(advanceTimer(STEPS, begun, 500)).toBe(begun)
  })
})

describe('tapNext', () => {
  it('begins the next step now', () => {
    expect(tapNext(STEPS, [0], 30)).toEqual([0, 30])
  })

  it('counts the bloom from when the bloom pour began', () => {
    const steps = timerSteps([action('Close the valve'), pour(27, 27), pour(135, 108)], 45)
    const begun = tapNext(steps, startTimer(steps), 20)
    expect(begun).toEqual([0, 20])
    expect(nextStartTime(steps, begun)).toBe(65)
  })

  it('does nothing on the last step', () => {
    const begun = [0, 45, 120, 150]
    expect(tapNext(STEPS, begun, 160)).toBe(begun)
  })
})

describe('timerView', () => {
  it('shows the step, the next one and the countdown', () => {
    const view = timerView(STEPS, [0], 10, 180)
    expect(view.current?.title).toBe('Bloom')
    expect(view.next).toBe(STEPS[1])
    expect(view.countdown).toBe(35)
    expect(view.sinceStep).toBe(10)
    expect(view.toTarget).toBeNull()
  })

  it('has no countdown when the next step waits for a tap', () => {
    const view = timerView(STEPS, [0, 45, 120], 200, 180)
    expect(view.current?.title).toBe('Open the valve')
    expect(view.next).toBe(STEPS[3])
    expect(view.countdown).toBeNull()
    expect(view.sinceStep).toBe(80)
  })

  it('counts to the target on the last step, then past it', () => {
    const begun = [0, 45, 120, 150]
    expect(timerView(STEPS, begun, 170, 180)).toMatchObject({ next: null, toTarget: 10 })
    expect(timerView(STEPS, begun, 190, 180).toTarget).toBe(-10)
    expect(timerView(STEPS, begun, 190, null).toTarget).toBeNull()
  })

  it('copes with no steps', () => {
    const view = timerView([], [], 30, 180)
    expect(view).toMatchObject({ current: null, next: null, countdown: null, sinceStep: 30, toTarget: 150 })
  })
})

describe('elapsedSeconds', () => {
  it('rounds down to whole seconds, never below 0', () => {
    expect(elapsedSeconds(1000, 1000)).toBe(0)
    expect(elapsedSeconds(1000, 1999)).toBe(0)
    expect(elapsedSeconds(1000, 191_500)).toBe(190)
    expect(elapsedSeconds(5000, 1000)).toBe(0)
  })
})
