import { useState, type FormEvent } from 'react'
import ErrorLine from '../components/ErrorLine'
import { INPUT, LoadFailed, Screen, SMALL_BUTTON } from '../components/ui'
import { dataMessage, isInUseError, isOnline } from '../lib/dataMessage'
import { useLoad } from '../lib/useLoad'
import { checkMethodName } from './methodName'
import { addMethod, isDuplicate, listMethods, removeMethod, renameMethod } from './methodsData'
import type { Method } from './types'

const SUGGESTIONS = ['Hario Switch', 'V60', 'OXO Rapid Brewer', 'Cafelat Robot']
const DUPLICATE = 'You already have that method.'

export default function MethodsScreen() {
  const { result, reload, setData } = useLoad(listMethods, 'your methods')
  const methods = result.state === 'loaded' ? result.data : []
  const names = methods.map((m) => m.name)

  const [typed, setTyped] = useState('')
  const [addError, setAddError] = useState('')
  const [busy, setBusy] = useState(false)
  // Suggestions show only if the list was empty when the screen opened; each one
  // disappears once tapped, and they're gone for good once he has methods.
  const [suggestionsLeft, setSuggestionsLeft] = useState<string[] | null>(null)
  if (result.state === 'loaded' && suggestionsLeft === null) {
    setSuggestionsLeft(result.data.length === 0 ? SUGGESTIONS : [])
  }

  async function add(name: string): Promise<string> {
    const check = checkMethodName(name, names)
    if (!check.ok) return check.message
    const reply = await addMethod(check.name)
    if (!reply.ok) return isDuplicate(reply.error) ? DUPLICATE : dataMessage(reply.error, 'save', isOnline())
    setData([...methods, reply.data])
    return ''
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    const problem = await add(typed)
    setAddError(problem)
    if (!problem) setTyped('')
    setBusy(false)
  }

  async function handleSuggestion(name: string) {
    if (busy) return
    setBusy(true)
    const problem = await add(name)
    setAddError(problem)
    if (!problem) setSuggestionsLeft((left) => (left ?? []).filter((s) => s !== name))
    setBusy(false)
  }

  return (
    <Screen title="Brewing methods" back="/coffee/beans">
      {result.state === 'failed' && <LoadFailed message={result.message} onRetry={reload} />}
      {result.state === 'loaded' && (
        <>
          <form onSubmit={handleAdd} className="mt-8">
            <label className="block text-sm text-muted">
              Add a method
              <div className="mt-1 flex gap-2">
                <input
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  maxLength={60}
                  className={`${INPUT} mt-0 flex-1`}
                />
                <button type="submit" disabled={busy} className={SMALL_BUTTON}>
                  {busy ? 'Adding…' : 'Add'}
                </button>
              </div>
            </label>
            <ErrorLine message={addError} className="mt-2" />
          </form>

          {suggestionsLeft && suggestionsLeft.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {suggestionsLeft.map((name) => (
                <button
                  key={name}
                  type="button"
                  disabled={busy}
                  onClick={() => handleSuggestion(name)}
                  className="press h-12 rounded-full border border-line px-4 text-muted"
                >
                  + {name}
                </button>
              ))}
            </div>
          )}

          <ul className="mt-8 divide-y divide-line border-y border-line">
            {methods.map((method) => (
              <MethodRow
                key={method.id}
                method={method}
                names={names}
                onRenamed={(renamed) => setData(methods.map((m) => (m.id === renamed.id ? renamed : m)))}
                onRemoved={() => setData(methods.filter((m) => m.id !== method.id))}
              />
            ))}
          </ul>
        </>
      )}
    </Screen>
  )
}

type RowProps = {
  method: Method
  names: string[]
  onRenamed: (method: Method) => void
  onRemoved: () => void
}

function MethodRow({ method, names, onRenamed, onRemoved }: RowProps) {
  const [mode, setMode] = useState<'show' | 'rename' | 'remove'>('show')
  const [typed, setTyped] = useState(method.name)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function reset() {
    setMode('show')
    setTyped(method.name)
    setError('')
  }

  async function handleRename(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const check = checkMethodName(typed, names, method.name)
    if (!check.ok) return setError(check.message)
    if (check.name === method.name) return reset()
    setBusy(true)
    const reply = await renameMethod(method.id, check.name)
    setBusy(false)
    if (!reply.ok) {
      return setError(isDuplicate(reply.error) ? DUPLICATE : dataMessage(reply.error, 'save', isOnline()))
    }
    setError('')
    setMode('show')
    onRenamed(reply.data)
  }

  async function handleRemove() {
    if (busy) return
    setBusy(true)
    const reply = await removeMethod(method.id)
    setBusy(false)
    if (!reply.ok) {
      setMode('show')
      return setError(
        isInUseError(reply.error)
          ? `${method.name} is used by recipes or brews, so it can't be removed.`
          : dataMessage(reply.error, 'delete', isOnline()),
      )
    }
    onRemoved()
  }

  return (
    <li className="py-2">
      {mode === 'show' && (
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => setMode('rename')} className="h-12 flex-1 text-left text-lg">
            {method.name}
          </button>
          <button type="button" onClick={() => setMode('remove')} className="h-12 px-2 text-sm text-muted">
            Remove
          </button>
        </div>
      )}

      {mode === 'rename' && (
        <form onSubmit={handleRename} className="flex gap-2">
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            maxLength={60}
            aria-label="Method name"
            className={`${INPUT} mt-0 flex-1`}
          />
          <button type="submit" disabled={busy} className={SMALL_BUTTON}>
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={reset} className="h-12 px-2 text-muted">
            Cancel
          </button>
        </form>
      )}

      {mode === 'remove' && (
        <div className="flex items-center justify-between gap-2">
          <span className="flex-1">Remove {method.name}?</span>
          <button type="button" disabled={busy} onClick={handleRemove} className={SMALL_BUTTON}>
            {busy ? 'Removing…' : 'Remove'}
          </button>
          <button type="button" onClick={reset} className="h-12 px-2 text-muted">
            Cancel
          </button>
        </div>
      )}

      <ErrorLine message={error} className="mt-1" />
    </li>
  )
}
