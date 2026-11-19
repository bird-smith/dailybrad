import { describe, expect, it } from 'vitest'
import {
  BACKUP_DAMAGED,
  BACKUP_NEWER,
  NOT_A_BACKUP,
  backupDateLabel,
  backupFileName,
  makeBackup,
  readBackup,
  type Backup,
} from './backupFile'
import type { Bean, Brew, Method, Recipe } from './types'

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

const method: Method = { id: uuid(1), name: 'V60', created_at: '2026-01-01T00:00:00.000Z' }
const bean: Bean = {
  id: uuid(2),
  name: 'Kenya AA',
  roaster: 'Onyx',
  roast_date: '2026-11-01',
  bag_grams: 340,
  cost_cents: 2200,
  region: null,
  process: 'washed',
  varietal: null,
  notes: null,
  finished: false,
  is_active: true,
  created_at: '2026-11-02T00:00:00.000Z',
}
const recipe: Recipe = {
  id: uuid(3),
  method_id: uuid(1),
  name: 'Kasuya',
  ratio: 15,
  dose_grams: 20,
  grinder: null,
  grind_size: '24',
  temperature: 94,
  bloom_seconds: 45,
  total_seconds: 210,
  steps: [{ kind: 'pour', percent: 20, at: 0 }],
  notes: null,
  created_at: '2026-11-03T00:00:00.000Z',
}
const brew: Brew = {
  id: uuid(4),
  brewed_at: '2026-11-18T07:00:00.000Z',
  bean_id: uuid(2),
  method_id: uuid(1),
  recipe_id: uuid(3),
  recipe_name: 'Kasuya',
  dose_grams: 20,
  ratio: 15,
  grinder: null,
  grind_size: '24',
  temperature: 94,
  bloom_seconds: 45,
  brew_seconds: 205,
  steps: [{ kind: 'pour', percent: 20, at: 0 }],
  rating: 4,
  taste_words: ['balanced'],
  rating_note: 'Nice',
}
const now = new Date('2026-11-18T07:42:00.000Z')

function fileText(change: (backup: Record<string, unknown>) => void = () => {}): string {
  const backup = JSON.parse(
    JSON.stringify(makeBackup({ methods: [method], beans: [bean], recipes: [recipe], brews: [brew] }, now)),
  )
  change(backup)
  return JSON.stringify(backup)
}

describe('makeBackup and readBackup', () => {
  it('give back the same rows after a round trip', () => {
    const result = readBackup(fileText())
    expect(result).toEqual({
      kind: 'coffee-backup',
      version: 1,
      exported_at: '2026-11-18T07:42:00.000Z',
      methods: [method],
      beans: [bean],
      recipes: [recipe],
      brews: [brew],
    } satisfies Backup)
  })
  it('leave out user_id and unknown fields', () => {
    const withOwner = { ...brew, user_id: 'someone', extra: 1 } as Brew
    const backup = makeBackup({ methods: [], beans: [], recipes: [], brews: [withOwner] }, now)
    expect(JSON.stringify(backup)).not.toContain('user_id')
    expect(JSON.stringify(backup)).not.toContain('extra')
    const read = readBackup(fileText((b) => ((b.methods as object[])[0] = { ...method, user_id: 'x', z: 2 })))
    expect('methods' in read && read.methods[0]).toEqual(method)
  })
})

describe('backupFileName', () => {
  it('uses the local date', () => {
    expect(backupFileName(new Date(2026, 10, 18, 23, 30))).toBe('coffee-backup-2026-11-18.json')
    expect(backupFileName(new Date(2026, 0, 5, 0, 1))).toBe('coffee-backup-2026-01-05.json')
  })
})

describe('backupDateLabel', () => {
  it('reads like Nov 18, 2026', () => {
    expect(backupDateLabel(new Date(2026, 10, 18, 9).toISOString())).toBe('Nov 18, 2026')
  })
})

describe('readBackup refuses', () => {
  it('what is not a backup', () => {
    for (const text of ['hello', '[]', 'null', '{"kind":"photo","version":1}', '']) {
      expect(readBackup(text)).toEqual({ problem: NOT_A_BACKUP })
    }
    expect(readBackup(fileText((b) => (b.version = 0)))).toEqual({ problem: NOT_A_BACKUP })
    expect(readBackup(fileText((b) => (b.version = '1')))).toEqual({ problem: NOT_A_BACKUP })
    expect(readBackup(fileText((b) => (b.version = 1.5)))).toEqual({ problem: NOT_A_BACKUP })
  })
  it('a newer version', () => {
    expect(readBackup(fileText((b) => (b.version = 2)))).toEqual({ problem: BACKUP_NEWER })
  })
  it('damaged rows, saying which', () => {
    const brews = (b: Record<string, unknown>) => b.brews as Record<string, unknown>[]
    const twoBrews = (b: Record<string, unknown>) => (b.brews = [brew, { ...brew, id: uuid(9) }])
    expect(
      readBackup(
        fileText((b) => {
          twoBrews(b)
          delete brews(b)[1].brewed_at
        }),
      ),
    ).toEqual({ problem: BACKUP_DAMAGED, where: 'brews, row 2' })
    expect(readBackup(fileText((b) => (brews(b)[0].brewed_at = 'soon')))).toEqual({
      problem: BACKUP_DAMAGED,
      where: 'brews, row 1',
    })
    expect(
      readBackup(fileText((b) => ((b.recipes as Record<string, unknown>[])[0].steps = 'x'))),
    ).toEqual({ problem: BACKUP_DAMAGED, where: 'recipes, row 1' })
    expect(readBackup(fileText((b) => ((b.beans as Record<string, unknown>[])[0].id = '12')))).toEqual({
      problem: BACKUP_DAMAGED,
      where: 'beans, row 1',
    })
    expect(readBackup(fileText((b) => (b.brews = [brew, brew])))).toEqual({
      problem: BACKUP_DAMAGED,
      where: 'brews, row 2',
    })
    expect(readBackup(fileText((b) => delete b.recipes))).toEqual({ problem: BACKUP_DAMAGED, where: 'recipes' })
    expect(readBackup(fileText((b) => (b.methods = [7])))).toEqual({
      problem: BACKUP_DAMAGED,
      where: 'methods, row 1',
    })
  })
})

describe('readBackup accepts an older file', () => {
  it('missing rating_note and taste_words, and does not send them', () => {
    const read = readBackup(
      fileText((b) => {
        const row = (b.brews as Record<string, unknown>[])[0]
        delete row.rating_note
        delete row.taste_words
      }),
    )
    expect('brews' in read).toBe(true)
    if (!('brews' in read)) return
    expect('rating_note' in read.brews[0]).toBe(false)
    expect('taste_words' in read.brews[0]).toBe(false)
    expect(read.brews[0].rating).toBe(4)
  })
})
