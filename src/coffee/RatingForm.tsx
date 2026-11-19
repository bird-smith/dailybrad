import { useState, type FormEvent } from 'react'
import ErrorLine from '../components/ErrorLine'
import { dataMessage, isOnline } from '../lib/dataMessage'
import { rateBrew } from './brewsData'
import { checkRating, ratingToForm, toggleTasteWord, type RatingErrors, type RatingForm as Form } from './rating'
import RatingDots from './RatingDots'
import { TASTE_WORDS, type RatingValues } from './types'

type Props = {
  brewId: string
  /** The saved rating when changing one; leave out for a brew not rated yet. */
  saved?: RatingValues
  onSaved: (values: RatingValues) => void
  /** Shown only when changing a rating. */
  onCancel?: () => void
}

const NOTE_BOX =
  'mt-1 block w-full rounded-lg border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-accent'

// The dots first; once one is tapped, the taste words, the note and Save rating.
export default function RatingForm({ brewId, saved, onSaved, onCancel }: Props) {
  const [form, setForm] = useState<Form>(() => (saved ? ratingToForm(saved) : { rating: null, words: [], noteText: '' }))
  const [errors, setErrors] = useState<RatingErrors>({})
  const [saveError, setSaveError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const check = checkRating(form)
    if (!check.ok) return setErrors(check.errors)
    setErrors({})
    setSaveError('')
    setBusy(true)
    const reply = await rateBrew(brewId, check.values)
    setBusy(false)
    if (!reply.ok) return setSaveError(dataMessage(reply.error, 'save', isOnline()))
    if (reply.data.length === 0) return setSaveError("This brew isn't here any more.")
    onSaved(check.values)
  }

  return (
    <form onSubmit={handleSave} noValidate className="space-y-4">
      <div className="-ml-3">
        <RatingDots rating={form.rating} onChoose={(rating) => setForm({ ...form, rating })} />
      </div>
      <ErrorLine message={errors.rating ?? ''} />
      {form.rating !== null && (
        <>
          <div className="flex flex-wrap gap-2">
            {TASTE_WORDS.map((word) => {
              const on = form.words.includes(word)
              return (
                <button
                  key={word}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setForm({ ...form, words: toggleTasteWord(form.words, word) })}
                  className={`press min-h-11 rounded-lg border px-4 ${on ? 'border-accent text-accent' : 'border-line text-ink'}`}
                >
                  {word}
                </button>
              )
            })}
          </div>
          <label className="block text-sm text-muted">
            Note (optional)
            <textarea
              rows={3}
              value={form.noteText}
              onChange={(e) => setForm({ ...form, noteText: e.target.value })}
              className={NOTE_BOX}
            />
            <ErrorLine message={errors.note ?? ''} className="mt-1 text-base" />
          </label>
          <ErrorLine message={saveError} />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="press h-12 rounded-lg border border-ink px-5 text-ink disabled:opacity-60">
              {busy ? 'Saving…' : 'Save rating'}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="h-12 px-3 text-muted">
                Cancel
              </button>
            )}
          </div>
        </>
      )}
    </form>
  )
}
