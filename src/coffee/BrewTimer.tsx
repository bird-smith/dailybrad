import { BIG_BUTTON } from '../components/ui'
import type { TimerStep, TimerView } from './brewTimer'
import { formatClock } from './clock'

type Props = {
  view: TimerView
  elapsed: number
  recipeName: string
  canKeepAwake: boolean
  onNext: () => void
  onDone: () => void
  onCancel: () => void
}

const OUTLINED_BUTTON =
  'press flex h-16 w-full items-center justify-center rounded-xl border border-line text-lg text-ink'

/** "Pour to 270 g", "Bloom, pour to 27 g" or the step's own words. */
function nextLabel(step: TimerStep) {
  if (step.row.kind === 'action') return step.title
  return `${step.title === 'Bloom' ? 'Bloom, pour' : 'Pour'} to ${step.row.pourTo} g`
}

// The full-screen timer: one step at a time, read at arm's length.
export default function BrewTimer({ view, elapsed, recipeName, canKeepAwake, onNext, onDone, onCancel }: Props) {
  const { current, next, countdown, sinceStep, toTarget } = view
  const last = next === null

  return (
    <div className="screen-in fixed inset-0 z-10 overflow-y-auto bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-6 pb-8">
        <div className="flex items-baseline justify-between gap-4 text-sm text-muted">
          <span className="tabular-nums">{formatClock(elapsed)}</span>
          <span className="truncate">{recipeName}</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          {current && <p className="font-serif text-4xl">{current.title}</p>}
          {current?.row.kind === 'pour' && (
            <p className="mt-4 flex items-baseline gap-3">
              <span className="font-serif text-7xl tabular-nums">
                {current.row.pourTo} <span className="text-4xl text-muted">g</span>
              </span>
              <span className="text-xl text-muted tabular-nums">+{current.row.amount}</span>
            </p>
          )}
          {!current && <p className="font-serif text-7xl tabular-nums">{formatClock(elapsed)}</p>}

          <div className="mt-10">
            {countdown !== null ? (
              <>
                <p className="text-5xl tabular-nums">{formatClock(countdown)}</p>
                <p className="mt-1 text-muted">until next step</p>
              </>
            ) : toTarget !== null ? (
              <p className="text-3xl text-muted tabular-nums">
                {formatClock(Math.abs(toTarget))} {toTarget >= 0 ? 'to target' : 'over target'}
              </p>
            ) : (
              current && <p className="text-3xl text-muted tabular-nums">{formatClock(sinceStep)}</p>
            )}
          </div>

          {next && <p className="mt-8 text-muted">Next: {nextLabel(next)}</p>}
        </div>

        {!canKeepAwake && <p className="mb-4 text-center text-sm text-muted">Your phone may dim the screen during the brew.</p>}
        <div className="space-y-6">
          {!last && (
            <button type="button" onClick={onNext} className={OUTLINED_BUTTON}>
              Next
            </button>
          )}
          <button type="button" onClick={onDone} className={BIG_BUTTON}>
            Done
          </button>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="press mt-8 h-12 self-center px-4 text-sm text-muted underline underline-offset-4"
        >
          Cancel timer
        </button>
      </div>
    </div>
  )
}
