import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import ErrorLine from '../components/ErrorLine'
import { BIG_BUTTON, INPUT, LoadFailed, QUIET_LINK, Screen } from '../components/ui'
import { dataMessage, isInUseError, isOnline } from '../lib/dataMessage'
import type { DataResult } from '../lib/dataResult'
import { useLoad } from '../lib/useLoad'
import { getBean } from './beansData'
import { brewRows, changedSettings, draftFromRecipe, settingsSummary, stepDose, type BrewDraft } from './brewSetup'
import { brewToSave } from './brewLog'
import { addBrew } from './brewsData'
import BrewTimerView from './BrewTimerView'
import { useBrewTimer } from './useBrewTimer'
import { formatClock, parseClock } from './clock'
import { listMethods } from './methodsData'
import {
  checkBloom,
  checkDose,
  checkRatio,
  checkShortText,
  checkTemperature,
  TEMP_UNIT,
  type BoxCheck,
} from './recipeForm'
import { formatOneDecimal } from './recipeList'
import { getRecipe } from './recipesData'
import { daysSinceRoast, roastAgeLabel } from './roastAge'
import type { Bean, Method, Recipe } from './types'

type Loaded = { recipe: Recipe | null; bean: Bean | null; methods: Method[] }

async function loadBrew(recipeId: string, beanId: string): Promise<DataResult<Loaded>> {
  const [recipe, bean, methods] = await Promise.all([getRecipe(recipeId), getBean(beanId), listMethods()])
  if (!recipe.ok) return recipe
  if (!bean.ok) return bean
  if (!methods.ok) return methods
  return { ok: true, data: { recipe: recipe.data, bean: bean.data, methods: methods.data } }
}

// The screen he reads at the kettle: dose, water and each pour, scaled. Nothing is saved.
export default function BrewScreen() {
  const { recipeId = '', beanId = '' } = useParams()
  const { result, reload } = useLoad(() => loadBrew(recipeId, beanId), 'this recipe', [recipeId, beanId])
  const data = result.state === 'loaded' ? result.data : null

  return (
    <Screen title={data?.recipe?.name ?? ''} back="/coffee/brew">
      {result.state === 'failed' && <LoadFailed message={result.message} onRetry={reload} />}
      {data && !data.recipe && <p className="mt-8 text-muted">This recipe isn't here any more.</p>}
      {data?.recipe && !data.bean && <p className="mt-8 text-muted">This bean isn't here any more.</p>}
      {data?.recipe && data.bean && (
        <Brew
          key={`${recipeId}/${beanId}`}
          recipe={data.recipe}
          bean={data.bean}
          methodName={data.methods.find((m) => m.id === data.recipe!.method_id)?.name ?? ''}
        />
      )}
    </Screen>
  )
}

type Boxes = { ratio: string; grinder: string; grindSize: string; temperature: string; bloom: string }

function boxesFromRecipe(recipe: Recipe): Boxes {
  return {
    ratio: formatOneDecimal(recipe.ratio),
    grinder: recipe.grinder ?? '',
    grindSize: recipe.grind_size ?? '',
    temperature: recipe.temperature === null ? '' : String(recipe.temperature),
    bloom: recipe.bloom_seconds === null ? '' : formatClock(recipe.bloom_seconds),
  }
}

const valueOr = <T,>(check: BoxCheck<T>, fallback: T) => (check.ok ? check.value : fallback)
const BIG_ROUND =
  'press flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line text-3xl ' +
  'text-ink disabled:opacity-40'

function Brew({ recipe, bean, methodName }: { recipe: Recipe; bean: Bean; methodName: string }) {
  const [doseText, setDoseText] = useState(formatOneDecimal(recipe.dose_grams))
  const [typingDose, setTypingDose] = useState(false)
  const [boxes, setBoxes] = useState<Boxes>(() => boxesFromRecipe(recipe))
  const [changing, setChanging] = useState(false)

  const dose = checkDose(doseText)
  const checks = {
    ratio: checkRatio(boxes.ratio),
    grinder: checkShortText(boxes.grinder, 60),
    grindSize: checkShortText(boxes.grindSize, 30),
    temperature: checkTemperature(boxes.temperature),
    bloom: checkBloom(boxes.bloom),
  }
  // Today's brew. A box with a mistake falls back to the recipe's value until fixed.
  const base = draftFromRecipe(recipe, bean.id)
  const draft: BrewDraft = {
    ...base,
    dose: valueOr(dose, base.dose),
    ratio: valueOr(checks.ratio, base.ratio),
    grinder: valueOr(checks.grinder, base.grinder),
    grindSize: valueOr(checks.grindSize, base.grindSize),
    temperature: valueOr(checks.temperature, base.temperature),
    bloomSeconds: valueOr(checks.bloom, base.bloomSeconds),
  }
  const scaled = dose.ok && checks.ratio.ok ? brewRows(draft) : null
  const changed = changedSettings(draft, recipe)
  const age = roastAgeLabel(daysSinceRoast(bean.roast_date, new Date()))
  const step = (direction: 1 | -1) => setDoseText(formatOneDecimal(stepDose(draft.dose, direction)))
  const setBox = (key: keyof Boxes) => (value: string) => setBoxes((b) => ({ ...b, [key]: value }))
  const boxesOk = dose.ok && Object.values(checks).every((c) => c.ok)

  // The timer is a view of this screen: `?timer=on` in the address, so Back just closes it.
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const showing = searchParams.get('timer') === 'on'
  const timer = useBrewTimer(showing)
  const [brewTime, setBrewTime] = useState('')
  const [timerError, setTimerError] = useState('')
  const [scrollToSave, setScrollToSave] = useState(false)
  const closing = useRef(false)
  const saveRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showing) closing.current = false
    // `?timer=on` with no timer (a refresh, or a pasted address): the plain brew screen.
    else if (!timer.running && !closing.current) setSearchParams({}, { replace: true })
  }, [showing, timer.running, setSearchParams])

  useEffect(() => {
    if (showing || !scrollToSave) return
    saveRef.current?.scrollIntoView({ block: 'center' })
    setScrollToSave(false)
  }, [showing, scrollToSave])

  function startTimer() {
    if (!boxesOk || !scaled) {
      setTimerError('Fix the boxes marked above first.')
      return
    }
    setTimerError('')
    timer.start(scaled.rows, draft.bloomSeconds, draft.totalSeconds)
    setSearchParams({ timer: 'on' })
  }

  function closeTimer() {
    closing.current = true
    navigate(-1)
  }

  function timerDone() {
    setBrewTime(formatClock(timer.done()))
    setScrollToSave(true)
    closeTimer()
  }

  function timerCancel() {
    timer.cancel()
    closeTimer()
  }

  if (showing && timer.view) {
    return (
      <BrewTimerView
        view={timer.view}
        elapsed={timer.elapsed}
        recipeName={recipe.name}
        canKeepAwake={timer.canKeepAwake}
        onNext={timer.next}
        onDone={timerDone}
        onCancel={timerCancel}
      />
    )
  }

  return (
    <>
      {timer.running && (
        <div className="mt-3 flex items-center justify-between gap-3 border-y border-line py-1 text-muted">
          <span className="tabular-nums">Timer running · {formatClock(timer.elapsed)}</span>
          <button type="button" onClick={() => setSearchParams({ timer: 'on' })} className={QUIET_LINK}>
            Back to timer
          </button>
        </div>
      )}
      <p className="mt-1 text-muted">{[methodName, bean.name, age].filter(Boolean).join(' · ')}</p>

      <div className="mt-10 flex items-center justify-between gap-2">
        <button type="button" aria-label="Less coffee" disabled={dose.ok && draft.dose <= 1} onClick={() => step(-1)} className={BIG_ROUND}>
          −
        </button>
        {typingDose ? (
          <input
            autoFocus
            inputMode="decimal"
            aria-label="Dose in grams"
            value={doseText}
            onChange={(e) => setDoseText(e.target.value)}
            onBlur={() => setTypingDose(false)}
            onKeyDown={(e) => e.key === 'Enter' && setTypingDose(false)}
            className="h-16 w-32 rounded-lg border border-line bg-paper text-center font-serif text-5xl tabular-nums outline-none focus:border-accent"
          />
        ) : (
          <button type="button" onClick={() => setTypingDose(true)} className="font-serif text-6xl tabular-nums">
            {doseText || '–'} <span className="text-3xl text-muted">g</span>
          </button>
        )}
        <button type="button" aria-label="More coffee" disabled={dose.ok && draft.dose >= 100} onClick={() => step(1)} className={BIG_ROUND}>
          +
        </button>
      </div>
      <ErrorLine message={dose.ok ? '' : dose.message} className="mt-2 text-center" />

      <p className="mt-6 text-center font-serif text-3xl tabular-nums">
        Water {scaled ? scaled.water : '–'} <span className="text-muted">g</span>
      </p>

      {draft.steps.length > 0 && (
        <ol className="mt-8 divide-y divide-line border-y border-line">
          {draft.steps.map((s, i) => {
            const row = scaled?.rows[i]
            return (
              <li key={i} className="flex min-h-14 items-baseline gap-3 py-3">
                {s.kind === 'pour' ? (
                  <>
                    <span className="font-serif text-3xl tabular-nums">
                      {row?.kind === 'pour' ? row.pourTo : '–'} <span className="text-lg text-muted">g</span>
                    </span>
                    <span className="text-muted tabular-nums">{row?.kind === 'pour' && `+${row.amount}`}</span>
                  </>
                ) : (
                  <span className="text-lg">{s.text}</span>
                )}
                {s.at !== null && <span className="ml-auto text-muted tabular-nums">at {formatClock(s.at)}</span>}
              </li>
            )
          })}
        </ol>
      )}

      <section className="mt-8">
        <p className="text-muted tabular-nums">{settingsSummary(draft)}</p>
        {!changing ? (
          <button type="button" onClick={() => setChanging(true)} className={QUIET_LINK}>
            Change for today
          </button>
        ) : (
          <div className="mt-4 space-y-5">
            <TodayBox label="Ratio" prefix="1 :" inputMode="decimal" value={boxes.ratio} onChange={setBox('ratio')} check={checks.ratio} recipeValue={changed.ratio} />
            <TodayBox label="Grinder" value={boxes.grinder} onChange={setBox('grinder')} check={checks.grinder} recipeValue={changed.grinder} />
            <TodayBox label="Grind size" value={boxes.grindSize} onChange={setBox('grindSize')} check={checks.grindSize} recipeValue={changed.grindSize} />
            <TodayBox label={`Temperature (${TEMP_UNIT})`} inputMode="numeric" value={boxes.temperature} onChange={setBox('temperature')} check={checks.temperature} recipeValue={changed.temperature} />
            <TodayBox label="Bloom" inputMode="numeric" value={boxes.bloom} onChange={setBox('bloom')} check={checks.bloom} recipeValue={changed.bloomSeconds} />
            <button type="button" onClick={() => setBoxes(boxesFromRecipe(recipe))} className={QUIET_LINK}>
              Use recipe settings
            </button>
          </div>
        )}
      </section>

      {recipe.total_seconds !== null && (
        <p className="mt-6 text-muted tabular-nums">Target {formatClock(recipe.total_seconds)}</p>
      )}
      <section className="mt-10">
        <button
          type="button"
          onClick={startTimer}
          className="press flex h-14 w-full items-center justify-center rounded-xl border border-line text-lg text-ink"
        >
          Start timer
        </button>
        <ErrorLine message={timerError} className="mt-2" />
      </section>
      <div ref={saveRef}>
        <SaveBrew draft={draft} recipeName={recipe.name} boxesOk={boxesOk} brewTime={brewTime} setBrewTime={setBrewTime} />
      </div>
    </>
  )
}

type SaveBrewProps = {
  draft: BrewDraft
  recipeName: string
  boxesOk: boolean
  brewTime: string
  setBrewTime: (text: string) => void
}

function SaveBrew({ draft, recipeName, boxesOk, brewTime, setBrewTime }: SaveBrewProps) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [timeError, setTimeError] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (busy) return
    setError('')
    const values = brewToSave(draft, recipeName, brewTime)
    setTimeError(values.ok ? '' : values.message)
    if (!boxesOk || !values.ok) {
      setError('Fix the boxes marked above first.')
      return
    }
    setBusy(true)
    const reply = await addBrew(values.values)
    setBusy(false)
    if (!reply.ok) {
      setError(
        isInUseError(reply.error)
          ? "This bean or recipe isn't here any more. Go back and choose again."
          : dataMessage(reply.error, 'save', isOnline()),
      )
      return
    }
    // Replace this screen, so Back from home doesn't return to a brew already saved.
    navigate('/coffee', { replace: true, state: { brewSaved: true } })
  }

  return (
    <section className="mt-10 space-y-4">
      <label className="block text-sm text-muted">
        Brew time
        <span className="mt-1 flex items-center gap-2">
          <input
            inputMode="numeric"
            placeholder="310"
            value={brewTime}
            onChange={(e) => setBrewTime(e.target.value)}
            className={`${INPUT} mt-0 tabular-nums`}
          />
          <span className="w-12 text-muted tabular-nums">{tidy(brewTime)}</span>
        </span>
        <ErrorLine message={timeError} className="mt-1 text-base" />
      </label>
      <ErrorLine message={error} />
      <button type="button" disabled={busy} onClick={save} className={BIG_BUTTON}>
        {busy ? 'Saving…' : 'Save brew'}
      </button>
    </section>
  )
}

/** "310" shows "3:10" beside the box. */
function tidy(text: string) {
  const parsed = parseClock(text)
  return parsed.ok && parsed.seconds !== null && text.trim() !== formatClock(parsed.seconds)
    ? formatClock(parsed.seconds)
    : ''
}

type TodayBoxProps = {
  label: string
  value: string
  onChange: (value: string) => void
  check: BoxCheck<unknown>
  recipeValue?: string
  prefix?: string
  inputMode?: 'decimal' | 'numeric'
}

function TodayBox({ label, value, onChange, check, recipeValue, prefix, inputMode }: TodayBoxProps) {
  return (
    <label className="block text-sm text-muted">
      {label}
      <span className="mt-1 flex items-center gap-2 text-base text-ink">
        {prefix}
        <input inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT} mt-0`} />
      </span>
      {recipeValue !== undefined && <span className="mt-1 block">Recipe: {recipeValue}</span>}
      <ErrorLine message={check.ok ? '' : check.message} className="mt-1 text-base" />
    </label>
  )
}
