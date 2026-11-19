import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import ErrorLine from '../components/ErrorLine'
import { INPUT, LoadFailed, QUIET_LINK, SMALL_BUTTON } from '../components/ui'
import { dataMessage, isOnline } from '../lib/dataMessage'
import { useLoad } from '../lib/useLoad'
import { splitFinished } from './beanList'
import { brewDayLabel, brewToFixForm, checkBrewFix, draftFromBrew, roastAgeOnBrewDay, type BrewFixForm } from './brewLog'
import { brewRows } from './brewSetup'
import { deleteBrew, getBrew, updateBrew } from './brewsData'
import { formatClock } from './clock'
import type { HistoryData } from './HistoryScreen'
import { checkDose, checkRatio, TEMP_UNIT } from './recipeForm'
import { brewsLikeThis, filterToParams } from './historyFilter'
import RatingDots from './RatingDots'
import RatingForm from './RatingForm'
import { formatOneDecimal } from './recipeList'
import type { Brew, RatingValues } from './types'

type Props = {
  brewId: string
  /** From the loaded list, or null for an older brew opened by its address. */
  brew: Brew | null
  data: HistoryData
  onChanged: (brew: Brew) => void
  onDeleted: () => void
}

export default function BrewDetails(props: Props) {
  if (props.brew) return <Details {...props} brew={props.brew} />
  return <LoadOne {...props} />
}

function LoadOne(props: Props) {
  const { result, reload, setData } = useLoad(() => getBrew(props.brewId), 'this brew', [props.brewId])
  if (result.state === 'failed') return <LoadFailed message={result.message} onRetry={reload} />
  if (result.state === 'loading') return null
  if (!result.data) return <p className="text-muted">This brew isn't here any more.</p>
  return (
    <Details
      {...props}
      brew={result.data}
      onChanged={(brew) => {
        setData(brew)
        props.onChanged(brew)
      }}
    />
  )
}

function Details({ brew, data, onChanged, onDeleted }: Props & { brew: Brew }) {
  const [fixing, setFixing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const bean = data.beans.find((b) => b.id === brew.bean_id)
  const method = data.methods.find((m) => m.id === brew.method_id)
  const recipeName = data.recipes.find((r) => r.id === brew.recipe_id)?.name ?? brew.recipe_name
  const { water, rows } = brewRows(draftFromBrew(brew))
  const roastAge = bean ? roastAgeOnBrewDay(bean.roast_date, brew.brewed_at) : null
  const time = (s: number | null) => (s === null ? null : formatClock(s))

  const settings: [string, string | null][] = [
    ['Dose', `${formatOneDecimal(brew.dose_grams)} g`],
    ['Water', `${water} g`],
    ['Ratio', `1:${formatOneDecimal(brew.ratio)}`],
    ['Grinder', brew.grinder],
    ['Grind size', brew.grind_size],
    ['Temperature', brew.temperature === null ? null : `${brew.temperature} ${TEMP_UNIT}`],
    ['Bloom', time(brew.bloom_seconds)],
    ['Brew time', time(brew.brew_seconds)],
  ]

  async function handleDelete() {
    if (busy) return
    setBusy(true)
    setDeleteError('')
    const reply = await deleteBrew(brew.id)
    setBusy(false)
    if (!reply.ok) return setDeleteError(dataMessage(reply.error, 'delete', isOnline()))
    onDeleted()
  }

  return (
    <article>
      <h2 className="font-serif text-3xl">{recipeName}</h2>
      <p className="mt-1 text-muted tabular-nums">{brewDayLabel(brew.brewed_at, new Date())}</p>

      <RatingSection brew={brew} onChanged={onChanged} />

      <dl className="mt-6 space-y-1">
        <div>
          <dt className="text-sm text-muted">Bean</dt>
          <dd>{[bean?.name, bean?.roaster, roastAge].filter(Boolean).join(' · ')}</dd>
        </div>
        <div className="pt-2">
          <dt className="text-sm text-muted">Method</dt>
          <dd>{method?.name}</dd>
        </div>
      </dl>

      {fixing ? (
        <FixForm brew={brew} data={data} onCancel={() => setFixing(false)} onSaved={(b) => { setFixing(false); onChanged(b) }} />
      ) : (
        <>
          <dl className="mt-6 divide-y divide-line border-y border-line">
            {settings
              .filter(([, value]) => value !== null)
              .map(([label, value]) => (
                <div key={label} className="flex justify-between py-2">
                  <dt className="text-muted">{label}</dt>
                  <dd className="tabular-nums">{value}</dd>
                </div>
              ))}
          </dl>

          {rows.length > 0 && (
            <ol className="mt-6 space-y-1">
              {rows.map((row, i) => (
                <li key={i} className="flex items-baseline gap-3">
                  {row.kind === 'pour' ? (
                    <>
                      <span className="font-serif text-xl tabular-nums">{row.pourTo} g</span>
                      <span className="text-sm text-muted tabular-nums">+{row.amount}</span>
                    </>
                  ) : (
                    <span>{row.text}</span>
                  )}
                  {row.at !== null && <span className="ml-auto text-sm text-muted tabular-nums">at {formatClock(row.at)}</span>}
                </li>
              ))}
            </ol>
          )}

          <div className="mt-8 flex flex-col items-start">
            <button type="button" onClick={() => setFixing(true)} className={QUIET_LINK}>
              Fix this brew
            </button>
            <Link to={`/coffee/history?${filterToParams(brewsLikeThis(brew))}`} className={QUIET_LINK}>
              Brews like this
            </Link>
            {!confirmDelete ? (
              <button type="button" onClick={() => setConfirmDelete(true)} className={QUIET_LINK}>
                Delete brew
              </button>
            ) : (
              <div className="mt-2">
                <p>Delete this brew? This can't be undone.</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" disabled={busy} onClick={handleDelete} className={SMALL_BUTTON}>
                    {busy ? 'Deleting…' : 'Delete'}
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="h-12 px-3 text-muted">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <ErrorLine message={deleteError} className="mt-2" />
          </div>
        </>
      )}
    </article>
  )
}

function RatingSection({ brew, onChanged }: { brew: Brew; onChanged: (brew: Brew) => void }) {
  const [changing, setChanging] = useState(false)
  const saved = (values: RatingValues) => {
    setChanging(false)
    onChanged({ ...brew, ...values })
  }

  return (
    <section className="mt-6">
      <h3 className="text-sm text-muted">Rating</h3>
      {brew.rating === null ? (
        <>
          <p className="mt-1">Not rated yet.</p>
          <div className="mt-1">
            <RatingForm brewId={brew.id} onSaved={saved} />
          </div>
        </>
      ) : changing ? (
        <div className="mt-1">
          <RatingForm brewId={brew.id} saved={brew} onSaved={saved} onCancel={() => setChanging(false)} />
        </div>
      ) : (
        <>
          <p className="mt-2">
            <RatingDots rating={brew.rating} />
          </p>
          {brew.taste_words.length > 0 && <p className="mt-1 text-muted">{brew.taste_words.join(' · ')}</p>}
          {brew.rating_note && <p className="mt-1 whitespace-pre-line">{brew.rating_note}</p>}
          <button type="button" onClick={() => setChanging(true)} className={QUIET_LINK}>
            Change rating
          </button>
        </>
      )}
    </section>
  )
}

const FIX_FIELDS: { key: Exclude<keyof BrewFixForm, 'beanId'>; label: string; inputMode?: 'decimal' | 'numeric' }[] = [
  { key: 'dose', label: 'Dose (g)', inputMode: 'decimal' },
  { key: 'ratio', label: 'Ratio (1 : …)', inputMode: 'decimal' },
  { key: 'grinder', label: 'Grinder' },
  { key: 'grindSize', label: 'Grind size' },
  { key: 'temperature', label: `Temperature (${TEMP_UNIT})`, inputMode: 'numeric' },
  { key: 'bloom', label: 'Bloom', inputMode: 'numeric' },
  { key: 'brewTime', label: 'Brew time', inputMode: 'numeric' },
]

function FixForm(props: { brew: Brew; data: HistoryData; onCancel: () => void; onSaved: (brew: Brew) => void }) {
  const { brew, data } = props
  const [form, setForm] = useState<BrewFixForm>(() => brewToFixForm(brew))
  const [errors, setErrors] = useState<Partial<Record<keyof BrewFixForm, string>>>({})
  const [saveError, setSaveError] = useState('')
  const [busy, setBusy] = useState(false)

  // Bags in use, plus this brew's own bag even if it's finished.
  const inUse = splitFinished(data.beans).inUse
  const own = data.beans.find((b) => b.id === brew.bean_id)
  const bags = own && !inUse.includes(own) ? [...inUse, own] : inUse

  const dose = checkDose(form.dose)
  const ratio = checkRatio(form.ratio)
  const water =
    dose.ok && ratio.ok ? brewRows({ ...draftFromBrew(brew), dose: dose.value, ratio: ratio.value }).water : null

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const check = checkBrewFix(form)
    if (!check.ok) return setErrors(check.errors)
    setErrors({})
    setSaveError('')
    setBusy(true)
    const reply = await updateBrew(brew.id, check.changes)
    setBusy(false)
    if (!reply.ok) return setSaveError(dataMessage(reply.error, 'save', isOnline()))
    props.onSaved(reply.data)
  }

  return (
    <form onSubmit={handleSave} noValidate className="mt-6 space-y-5">
      <fieldset>
        <legend className="text-sm text-muted">Bag</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {bags.map((bag) => (
            <button
              key={bag.id}
              type="button"
              aria-pressed={form.beanId === bag.id}
              onClick={() => setForm({ ...form, beanId: bag.id })}
              className={`press h-12 rounded-lg border px-4 ${
                form.beanId === bag.id ? 'border-accent bg-accent text-on-accent' : 'border-line text-ink'
              }`}
            >
              {bag.name}
            </button>
          ))}
        </div>
        <ErrorLine message={errors.beanId ?? ''} className="mt-1" />
      </fieldset>
      {FIX_FIELDS.map((field) => (
        <label key={field.key} className="block text-sm text-muted">
          {field.label}
          <input
            inputMode={field.inputMode}
            value={form[field.key]}
            onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            className={`${INPUT} tabular-nums`}
          />
          <ErrorLine message={errors[field.key] ?? ''} className="mt-1 text-base" />
        </label>
      ))}
      <p className="text-muted tabular-nums">Water {water ?? '–'} g</p>
      <ErrorLine message={saveError} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className={SMALL_BUTTON}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={props.onCancel} className="h-12 px-3 text-muted">
          Cancel
        </button>
      </div>
    </form>
  )
}
