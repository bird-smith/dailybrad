import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import ErrorLine from '../components/ErrorLine'
import { BIG_BUTTON, INPUT, LoadFailed, QUIET_LINK, Screen, SMALL_BUTTON } from '../components/ui'
import { dataMessage, isInUseError, isOnline } from '../lib/dataMessage'
import type { DataResult } from '../lib/dataResult'
import { useLoad } from '../lib/useLoad'
import { beanToForm, checkBean, EMPTY_BEAN_FORM, type BeanForm } from './beanForm'
import { addBean, deleteBean, getActiveBean, getBean, setActiveBean, setFinished, updateBean } from './beansData'
import { localDateString } from './roastAge'
import type { Bean } from './types'

const NEW_BEAN: DataResult<null> = { ok: true, data: null }

// Adding (#/coffee/beans/new) and editing (#/coffee/beans/<id>) share this one form.
export default function BeanScreen() {
  const { id = 'new' } = useParams()
  const isNew = id === 'new'
  const { result, reload } = useLoad(() => (isNew ? Promise.resolve(NEW_BEAN) : getBean(id)), 'this bean', [id])

  return (
    <Screen title={isNew ? 'Add bean' : 'Bean'} back="/coffee/beans">
      {result.state === 'failed' && <LoadFailed message={result.message} onRetry={reload} />}
      {result.state === 'loaded' && !isNew && !result.data && (
        <p className="mt-8 text-muted">This bean isn't here any more.</p>
      )}
      {result.state === 'loaded' && (isNew || result.data) && <BeanEditor key={id} bean={result.data} />}
    </Screen>
  )
}

const FIELDS: { key: keyof BeanForm; label: string; type?: string; inputMode?: 'numeric' | 'decimal' }[] = [
  { key: 'name', label: 'Name' },
  { key: 'roaster', label: 'Roaster' },
  { key: 'roastDate', label: 'Roast date', type: 'date' },
  { key: 'bagGrams', label: 'Bag size (grams)', inputMode: 'numeric' },
  { key: 'cost', label: 'Cost ($)', inputMode: 'decimal' },
  { key: 'region', label: 'Region' },
  { key: 'varietal', label: 'Varietal' },
]

function BeanEditor({ bean }: { bean: Bean | null }) {
  const navigate = useNavigate()
  const [form, setForm] = useState<BeanForm>(bean ? beanToForm(bean) : EMPTY_BEAN_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof BeanForm, string>>>({})
  const [saveError, setSaveError] = useState('')
  const [busy, setBusy] = useState<'' | 'save' | 'finish' | 'delete'>('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState('')
  const today = localDateString(new Date())
  const backToList = () => navigate('/coffee/beans', { replace: true })

  const set = (key: keyof BeanForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const check = checkBean(form, today)
    if (!check.ok) {
      setErrors(check.errors)
      return
    }
    setErrors({})
    setSaveError('')
    setBusy('save')
    const reply = bean ? await updateBean(bean.id, check.values) : await addBean(check.values)
    if (!reply.ok) {
      setSaveError(dataMessage(reply.error, 'save', isOnline()))
      setBusy('')
      return
    }
    if (!bean) {
      // The first bag becomes the active one by itself. If this step fails, the bag is
      // still saved; he can tap Use on the Beans screen.
      const active = await getActiveBean()
      if (active.ok && !active.data) await setActiveBean(reply.data.id)
    }
    backToList()
  }

  async function handleFinished() {
    if (!bean || busy) return
    setBusy('finish')
    setActionError('')
    const reply = await setFinished(bean.id, !bean.finished)
    if (!reply.ok) {
      setActionError(dataMessage(reply.error, 'save', isOnline()))
      setBusy('')
      return
    }
    backToList()
  }

  async function handleDelete() {
    if (!bean || busy) return
    setBusy('delete')
    setActionError('')
    const reply = await deleteBean(bean.id)
    if (!reply.ok) {
      setActionError(
        isInUseError(reply.error)
          ? "This bean has brews, so it can't be deleted. Mark it finished instead."
          : dataMessage(reply.error, 'delete', isOnline()),
      )
      setBusy('')
      return
    }
    backToList()
  }

  return (
    <>
      <form onSubmit={handleSave} noValidate className="mt-8 space-y-5">
        {FIELDS.map((field) => (
          <label key={field.key} className="block text-sm text-muted">
            {field.label}
            <input
              type={field.type ?? 'text'}
              inputMode={field.inputMode}
              max={field.type === 'date' ? today : undefined}
              value={form[field.key]}
              onChange={(e) => set(field.key)(e.target.value)}
              aria-invalid={Boolean(errors[field.key])}
              className={INPUT}
            />
            <ErrorLine message={errors[field.key] ?? ''} className="mt-1 text-base" />
          </label>
        ))}
        <label className="block text-sm text-muted">
          Notes
          <textarea
            value={form.notes}
            onChange={(e) => set('notes')(e.target.value)}
            rows={4}
            className={`${INPUT} h-auto py-2`}
          />
          <ErrorLine message={errors.notes ?? ''} className="mt-1 text-base" />
        </label>

        <ErrorLine message={saveError} />
        <button type="submit" disabled={busy !== ''} className={BIG_BUTTON}>
          {busy === 'save' ? 'Saving…' : 'Save'}
        </button>
      </form>

      {bean && (
        <div className="mt-8 flex flex-col items-start">
          <button type="button" disabled={busy !== ''} onClick={handleFinished} className={QUIET_LINK}>
            {busy === 'finish' ? 'Saving…' : bean.finished ? 'Back in use' : 'Finished this bag'}
          </button>
          {!confirmDelete ? (
            <button type="button" onClick={() => setConfirmDelete(true)} className={QUIET_LINK}>
              Delete bean
            </button>
          ) : (
            <div className="mt-2 w-full">
              <p>Delete this bean? This can't be undone.</p>
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
          <ErrorLine message={actionError} className="mt-2" />
        </div>
      )}
    </>
  )
}
