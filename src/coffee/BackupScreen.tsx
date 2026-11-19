import { useRef, useState, type ChangeEvent } from 'react'
import ErrorLine from '../components/ErrorLine'
import { BIG_BUTTON, Screen, SMALL_BUTTON } from '../components/ui'
import { dataMessage, isOnline } from '../lib/dataMessage'
import { addRows, exportAll, readCurrent } from './backupData'
import {
  BACKUP_TOO_BIG,
  MAX_BACKUP_BYTES,
  NOT_A_BACKUP,
  backupDateLabel,
  backupFileName,
  makeBackup,
  readBackup,
  type Backup,
} from './backupFile'
import {
  IMPORT_ORDER,
  addedSoFarLine,
  countsOf,
  countsSentence,
  doneLine,
  importPreview,
  planImport,
  progressLine,
  type Counts,
  type ImportPlan,
} from './backupImport'
import { setActiveBean } from './beansData'

type Importing =
  | { stage: 'idle' }
  | { stage: 'problem'; message: string; where?: string }
  | { stage: 'preview'; backup: Backup; plan: ImportPlan }
  | { stage: 'adding'; line: string }
  | { stage: 'done'; line: string; note?: string }
  | { stage: 'stopped'; reason: string; soFar: string }

const OUTLINED_BUTTON =
  'press flex h-14 w-full items-center justify-center rounded-xl border border-line text-lg text-ink ' +
  'disabled:opacity-60'

function download(text: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  // Some phones start the download a moment later; let go of the file after that.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export default function BackupScreen() {
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)
  const [exportNote, setExportNote] = useState('')
  const [exportError, setExportError] = useState('')
  const [importing, setImporting] = useState<Importing>({ stage: 'idle' })
  const picker = useRef<HTMLInputElement>(null)

  async function handleExport() {
    if (busy) return
    setBusy('export')
    setExportNote('')
    setExportError('')
    const reply = await exportAll()
    if (!reply.ok) {
      setExportError(dataMessage(reply.error, 'export', isOnline()))
    } else {
      const now = new Date()
      const backup = makeBackup(reply.data, now)
      const fileName = backupFileName(now)
      download(JSON.stringify(backup, null, 2), fileName)
      const what = countsSentence(countsOf(backup)) || 'nothing logged yet'
      setExportNote(`Saved ${fileName}: ${what}. It's in your Downloads (on iPhone: the Files app, Downloads).`)
    }
    setBusy(null)
  }

  async function handleChoose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Cleared at once, so choosing the same file again still counts as a choice.
    event.target.value = ''
    if (!file || busy) return
    if (file.size > MAX_BACKUP_BYTES) return setImporting({ stage: 'problem', message: BACKUP_TOO_BIG })
    setBusy('import')
    setImporting({ stage: 'idle' })
    let text = ''
    try {
      text = await file.text()
    } catch {
      setBusy(null)
      return setImporting({ stage: 'problem', message: NOT_A_BACKUP })
    }
    const backup = readBackup(text)
    if ('problem' in backup) {
      setBusy(null)
      return setImporting({ stage: 'problem', message: backup.problem, where: backup.where })
    }
    const current = await readCurrent()
    if (!current.ok) {
      setBusy(null)
      const message = dataMessage(current.error, 'load', isOnline(), 'what is on the site')
      return setImporting({ stage: 'problem', message })
    }
    const plan = planImport(backup, current.data)
    setBusy(null)
    setImporting(
      'problem' in plan
        ? { stage: 'problem', message: plan.problem, where: plan.where }
        : { stage: 'preview', backup, plan },
    )
  }

  async function handleAdd(plan: ImportPlan) {
    if (busy) return
    setBusy('import')
    const added: Counts = { methods: 0, beans: 0, recipes: 0, brews: 0 }
    for (const table of IMPORT_ORDER) {
      const rows = plan.add[table]
      const total = rows.length
      if (total === 0) continue
      setImporting({ stage: 'adding', line: progressLine(table, 0, total) })
      const reply = await addRows(table, rows, (done) =>
        setImporting({ stage: 'adding', line: progressLine(table, done, total) }),
      )
      added[table] = reply.done
      if (!reply.ok) {
        setBusy(null)
        return setImporting({
          stage: 'stopped',
          reason: dataMessage(reply.error, 'import', isOnline()),
          soFar: addedSoFarLine(added, table, total),
        })
      }
    }
    let note: string | undefined
    if (plan.activeBeanId) {
      const reply = await setActiveBean(plan.activeBeanId)
      if (!reply.ok) note = "Your active bag wasn't set again: choose it in Beans."
    }
    setBusy(null)
    setImporting({ stage: 'done', line: doneLine(added), note })
  }

  const showCard = importing.stage === 'preview' || importing.stage === 'adding'

  return (
    <Screen title="Backup" back="/coffee">
      <p className="mt-4 text-muted">
        A backup file is a copy of your methods, beans, recipes and brews. Keep it somewhere safe, away from this
        site: email it to yourself or put it in your cloud drive.
      </p>

      <button type="button" onClick={handleExport} disabled={busy !== null} className={`${BIG_BUTTON} mt-8`}>
        {busy === 'export' ? 'Exporting…' : 'Export backup'}
      </button>
      <ErrorLine message={exportError} className="mt-3" />
      {exportNote && (
        <p role="status" className="mt-3 text-sm break-words text-muted">
          {exportNote}
        </p>
      )}

      <input
        ref={picker}
        type="file"
        accept=".json,application/json"
        onChange={handleChoose}
        className="hidden"
      />

      <div className="mt-16">
        {!showCard && (
          <button
            type="button"
            onClick={() => picker.current?.click()}
            disabled={busy !== null}
            className={OUTLINED_BUTTON}
          >
            {busy === 'import' ? 'Checking…' : 'Import a backup'}
          </button>
        )}

        {importing.stage === 'problem' && (
          <div className="mt-3">
            <ErrorLine message={importing.message} />
            {importing.where && <p className="mt-1 text-sm text-muted">({importing.where})</p>}
          </div>
        )}
        {importing.stage === 'done' && (
          <div role="status" className="mt-3">
            <p>{importing.line}</p>
            {importing.note && <p className="mt-1 text-muted">{importing.note}</p>}
          </div>
        )}
        {importing.stage === 'stopped' && (
          <div className="mt-3">
            <ErrorLine message={importing.reason} />
            <p className="mt-1 text-muted tabular-nums">{importing.soFar}</p>
          </div>
        )}

        {showCard && (
          <div className="rounded-xl border border-line p-4">
            {importing.stage === 'preview' && (
              <>
                <p>Backup from {backupDateLabel(importing.backup.exported_at)}.</p>
                <p className="mt-2">{importPreview(importing.plan)}</p>
                {countsSentence(countsOf(importing.plan.add)) ? (
                  <>
                    <p className="mt-2 text-sm text-muted">Nothing already on the site is changed or deleted.</p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleAdd(importing.plan)}
                        disabled={busy !== null}
                        className="press h-12 flex-1 rounded-lg bg-accent px-4 font-semibold text-on-accent disabled:opacity-70"
                      >
                        Add them
                      </button>
                      <button
                        type="button"
                        onClick={() => setImporting({ stage: 'idle' })}
                        disabled={busy !== null}
                        className={SMALL_BUTTON}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setImporting({ stage: 'idle' })}
                    className={`${SMALL_BUTTON} mt-4`}
                  >
                    Done
                  </button>
                )}
              </>
            )}
            {importing.stage === 'adding' && (
              <div role="status">
                <p className="text-muted tabular-nums">{importing.line}</p>
                <p className="mt-2 text-sm text-muted">Keep this screen open until it says Done.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Screen>
  )
}
