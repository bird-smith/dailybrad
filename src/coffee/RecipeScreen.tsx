import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import ErrorLine from '../components/ErrorLine'
import { BIG_BUTTON, INPUT, LoadFailed, QUIET_LINK, Screen, SMALL_BUTTON } from '../components/ui'
import { dataMessage, isOnline } from '../lib/dataMessage'
import { useLoad } from '../lib/useLoad'
import { formatClock, parseClock } from './clock'
import {
  checkRecipe,
  EMPTY_RECIPE_FORM,
  formWater,
  lastPourIndex,
  MAX_ROWS,
  newRowKey,
  parseOneDecimal,
  recipeToForm,
  TEMP_UNIT,
  type FormRow,
  type RecipeCheck,
  type RecipeForm,
} from './recipeForm'
import { formatOneDecimal } from './recipeList'
import { poursToPercents } from './recipeMath'
import { addRecipe, deleteRecipe, loadMethodsAndRecipes, updateRecipe } from './recipesData'
import type { Method, Recipe } from './types'

const STEP_FILL_INS = ['Close valve', 'Open valve', 'Swirl', 'Stir']
const SMALL_INPUT =
  'h-12 w-20 rounded-lg border border-line bg-paper px-2 text-base text-ink tabular-nums ' +
  'outline-none focus:border-accent'

// Adding (#/coffee/recipes/new) and editing (#/coffee/recipes/<id>) share this one form.
export default function RecipeScreen() {
  const { id = 'new' } = useParams()
  const isNew = id === 'new'
  const { result, reload } = useLoad(loadMethodsAndRecipes, 'this recipe', [id])
  const recipe = result.state === 'loaded' ? (result.data.recipes.find((r) => r.id === id) ?? null) : null

  return (
    <Screen title={isNew ? 'Add recipe' : 'Recipe'} back="/coffee/recipes">
      {result.state === 'failed' && <LoadFailed message={result.message} onRetry={reload} />}
      {result.state === 'loaded' && !isNew && !recipe && (
        <p className="mt-8 text-muted">This recipe isn't here any more.</p>
      )}
      {result.state === 'loaded' && (isNew || recipe) && (
        <RecipeEditor key={id} recipe={recipe} methods={result.data.methods} recipes={result.data.recipes} />
      )}
    </Screen>
  )
}

type Errors = Extract<RecipeCheck, { ok: false }>

function RecipeEditor({ recipe, methods, recipes }: { recipe: Recipe | null; methods: Method[]; recipes: Recipe[] }) {
  const navigate = useNavigate()
  const [form, setForm] = useState<RecipeForm>(() =>
    recipe ? recipeToForm(recipe) : { ...EMPTY_RECIPE_FORM, methodId: methods.length === 1 ? methods[0].id : '' },
  )
  const [problems, setProblems] = useState<Errors>({ ok: false, errors: {}, rowErrors: [] })
  const [saveError, setSaveError] = useState('')
  const [busy, setBusy] = useState<'' | 'save' | 'delete'>('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const backToList = () => navigate('/coffee/recipes', { replace: true })

  const set = (key: Exclude<keyof RecipeForm, 'rows'>) => (value: string) => setForm((f) => ({ ...f, [key]: value }))
  const setRows = (change: (rows: FormRow[]) => FormRow[]) => setForm((f) => ({ ...f, rows: change(f.rows) }))
  const errors = problems.errors

  const water = formWater(form)
  const shares = liveShares(form.rows, water)
  const lastPour = lastPourIndex(form.rows)
  const methodName = methods.find((m) => m.id === form.methodId)?.name ?? 'this method'
  const grinders = [...new Set(recipes.map((r) => r.grinder).filter((g): g is string => Boolean(g)))]

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const otherNames = recipes.filter((r) => r.method_id === form.methodId && r.id !== recipe?.id).map((r) => r.name)
    const check = checkRecipe(form, otherNames, methodName)
    if (!check.ok) {
      setProblems(check)
      return
    }
    setProblems({ ok: false, errors: {}, rowErrors: [] })
    setSaveError('')
    setBusy('save')
    const reply = recipe ? await updateRecipe(recipe.id, check.values) : await addRecipe(check.values)
    if (!reply.ok) {
      if (reply.error.code === '23505') {
        setProblems({
          ok: false,
          errors: { name: `You already have a recipe called ${check.values.name} for ${methodName}.` },
          rowErrors: [],
        })
      } else setSaveError(dataMessage(reply.error, 'save', isOnline()))
      setBusy('')
      return
    }
    backToList()
  }

  async function handleDelete() {
    if (!recipe || busy) return
    setBusy('delete')
    setDeleteError('')
    const reply = await deleteRecipe(recipe.id)
    if (!reply.ok) {
      setDeleteError(dataMessage(reply.error, 'delete', isOnline()))
      setBusy('')
      return
    }
    backToList()
  }

  const addRow = (kind: FormRow['kind']) =>
    setRows((rows) => [
      ...rows,
      kind === 'pour' ? { key: newRowKey(), kind, pourTo: '', at: '' } : { key: newRowKey(), kind, text: '', at: '' },
    ])
  const updateRow = (i: number, change: Partial<FormRow>) =>
    setRows((rows) => rows.map((row, j) => (j === i ? ({ ...row, ...change } as FormRow) : row)))
  const moveUp = (i: number) =>
    setRows((rows) => rows.map((row, j) => (j === i - 1 ? rows[i] : j === i ? rows[i - 1] : row)))
  const removeRow = (i: number) => setRows((rows) => rows.filter((_, j) => j !== i))

  return (
    <>
      <form onSubmit={handleSave} noValidate className="mt-8 space-y-5">
        <fieldset>
          <legend className="text-sm text-muted">Method</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {methods.map((method) => (
              <button
                key={method.id}
                type="button"
                aria-pressed={form.methodId === method.id}
                onClick={() => set('methodId')(method.id)}
                className={`press h-12 rounded-lg border px-4 ${
                  form.methodId === method.id ? 'border-accent bg-accent text-on-accent' : 'border-line text-ink'
                }`}
              >
                {method.name}
              </button>
            ))}
          </div>
          <ErrorLine message={errors.methodId ?? ''} className="mt-1" />
        </fieldset>

        <Field label="Name" error={errors.name}>
          <input value={form.name} onChange={(e) => set('name')(e.target.value)} className={INPUT} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ratio" error={errors.ratio}>
            <span className="mt-1 flex items-center gap-2 text-ink">
              1 :
              <input
                inputMode="decimal"
                value={form.ratio}
                onChange={(e) => set('ratio')(e.target.value)}
                className={`${INPUT} mt-0 tabular-nums`}
              />
            </span>
          </Field>
          <Field label="Dose" error={errors.dose}>
            <span className="mt-1 flex items-center gap-2 text-ink">
              <input
                inputMode="decimal"
                value={form.dose}
                onChange={(e) => set('dose')(e.target.value)}
                className={`${INPUT} mt-0 tabular-nums`}
              />
              g
            </span>
          </Field>
        </div>
        <p className="min-h-6 text-muted tabular-nums">{water !== null && `Water ${formatOneDecimal(water)} g`}</p>

        <Field label="Grinder" error={errors.grinder}>
          <input
            list="grinders"
            value={form.grinder}
            onChange={(e) => set('grinder')(e.target.value)}
            className={INPUT}
          />
          <datalist id="grinders">
            {grinders.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </Field>
        <Field label="Grind size" error={errors.grindSize}>
          <input value={form.grindSize} onChange={(e) => set('grindSize')(e.target.value)} className={INPUT} />
        </Field>
        <Field label={`Temperature (${TEMP_UNIT})`} error={errors.temperature}>
          <input
            inputMode="numeric"
            value={form.temperature}
            onChange={(e) => set('temperature')(e.target.value)}
            className={`${INPUT} tabular-nums`}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <TimeField label="Bloom" value={form.bloom} onChange={set('bloom')} error={errors.bloom} />
          <TimeField label="Total time" value={form.total} onChange={set('total')} error={errors.total} />
        </div>

        <fieldset>
          <legend className="text-sm text-muted">Pours and steps</legend>
          {form.rows.length > 0 && (
            <ol className="mt-1 divide-y divide-line border-y border-line">
              {form.rows.map((row, i) => (
                <li key={row.key} className="space-y-2 py-3">
                  <div className="flex items-center gap-2">
                    {row.kind === 'pour' && i !== lastPour && (
                      <>
                        <span>Pour to</span>
                        <input
                          inputMode="decimal"
                          aria-label="Pour to, grams"
                          value={row.pourTo}
                          onChange={(e) => updateRow(i, { pourTo: e.target.value })}
                          className={SMALL_INPUT}
                        />
                        <span>g</span>
                      </>
                    )}
                    {row.kind === 'pour' && i === lastPour && (
                      <span className="tabular-nums">
                        {water === null ? 'Pour the rest' : `Pour to ${formatOneDecimal(water)} g (the rest)`}
                      </span>
                    )}
                    {row.kind === 'action' && (
                      <input
                        aria-label="Step"
                        placeholder="Open the valve"
                        value={row.text}
                        onChange={(e) => updateRow(i, { text: e.target.value })}
                        className={`${INPUT} mt-0 flex-1`}
                      />
                    )}
                    {row.kind === 'pour' && shares[i] !== undefined && (
                      <span className="ml-auto text-sm text-muted tabular-nums">{shares[i]}%</span>
                    )}
                  </div>
                  {row.kind === 'action' && !row.text && (
                    <div className="flex flex-wrap gap-2">
                      {STEP_FILL_INS.map((text) => (
                        <button
                          key={text}
                          type="button"
                          onClick={() => updateRow(i, { text })}
                          className="press h-10 rounded-full border border-line px-3 text-sm text-muted"
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-muted">at</span>
                    <input
                      inputMode="numeric"
                      aria-label="At time"
                      placeholder="0:45"
                      value={row.at}
                      onChange={(e) => updateRow(i, { at: e.target.value })}
                      className={SMALL_INPUT}
                    />
                    <TidyTime value={row.at} />
                    <span className="flex-1" />
                    {i > 0 && (
                      <button
                        type="button"
                        aria-label="Move up"
                        onClick={() => moveUp(i)}
                        className="h-12 w-12 text-muted"
                      >
                        ↑
                      </button>
                    )}
                    <button type="button" onClick={() => removeRow(i)} className="h-12 px-2 text-sm text-muted">
                      Remove
                    </button>
                  </div>
                  <ErrorLine message={problems.rowErrors[i] ?? ''} />
                </li>
              ))}
            </ol>
          )}
          <div className="mt-2 flex gap-4">
            <button
              type="button"
              disabled={form.rows.length >= MAX_ROWS}
              onClick={() => addRow('pour')}
              className={QUIET_LINK}
            >
              Add pour
            </button>
            <button
              type="button"
              disabled={form.rows.length >= MAX_ROWS}
              onClick={() => addRow('action')}
              className={QUIET_LINK}
            >
              Add step
            </button>
          </div>
          <ErrorLine message={errors.rows ?? ''} />
        </fieldset>

        <Field label="Notes" error={errors.notes}>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes')(e.target.value)}
            rows={4}
            className={`${INPUT} h-auto py-2`}
          />
        </Field>

        <ErrorLine message={saveError} />
        <button type="submit" disabled={busy !== ''} className={BIG_BUTTON}>
          {busy === 'save' ? 'Saving…' : 'Save'}
        </button>
      </form>

      {recipe && (
        <div className="mt-8">
          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)} className={QUIET_LINK}>
              Delete recipe
            </button>
          ) : (
            <div>
              <p>Delete this recipe? Brews made with it stay in your history. This can't be undone.</p>
              <div className="mt-2 flex gap-2">
                <button type="button" disabled={busy !== ''} onClick={handleDelete} className={SMALL_BUTTON}>
                  {busy === 'delete' ? 'Deleting…' : 'Delete'}
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="h-12 px-3 text-muted">
                  Cancel
                </button>
              </div>
            </div>
          )}
          <ErrorLine message={deleteError} className="mt-2" />
        </div>
      )}
    </>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-muted">
      {label}
      {children}
      <ErrorLine message={error ?? ''} className="mt-1 text-base" />
    </label>
  )
}

function TimeField(props: { label: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <Field label={props.label} error={props.error}>
      <span className="mt-1 flex items-center gap-2">
        <input
          inputMode="numeric"
          placeholder="45"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className={`${INPUT} mt-0 tabular-nums`}
        />
        <TidyTime value={props.value} />
      </span>
    </Field>
  )
}

/** "300" typed shows "3:00" beside the box. */
function TidyTime({ value }: { value: string }) {
  const parsed = parseClock(value)
  const show = parsed.ok && parsed.seconds !== null && value.trim() !== formatClock(parsed.seconds)
  return <span className="w-12 text-muted tabular-nums">{show && parsed.ok ? formatClock(parsed.seconds!) : ''}</span>
}

/** Each pour's whole-number share of the water as typed, by row; empty until they make sense. */
function liveShares(rows: FormRow[], water: number | null): Record<number, number> {
  const pourRows = rows.flatMap((row, i) => (row.kind === 'pour' ? [{ row, i }] : []))
  if (water === null || pourRows.length === 0) return {}
  const weights = pourRows.slice(0, -1).map(({ row }) => parseOneDecimal(row.kind === 'pour' ? row.pourTo : ''))
  const valid = weights.every((w, j) => w !== null && w > (j ? weights[j - 1]! : 0) && w < water)
  if (!valid) return {}
  const percents = poursToPercents(weights as number[], water)
  return Object.fromEntries(pourRows.map(({ i }, j) => [i, Math.round(percents[j])]))
}
