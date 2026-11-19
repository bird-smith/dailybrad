import { describe, expect, it } from 'vitest'
import { BACKUP_DAMAGED, type Backup, type BrewRow } from './backupFile'
import {
  addedSoFarLine,
  countsSentence,
  doneLine,
  importPreview,
  inBatches,
  planImport,
  progressLine,
  type ImportPlan,
  type SiteNow,
} from './backupImport'

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const V60 = id(1)
const AERO = id(2)
const KENYA = id(11)
const PERU = id(12)
const KASUYA = id(21)
const INVERTED = id(22)

const brew = (n: number, bean: string, method: string, recipe: string | null, name: string): BrewRow => ({
  id: id(30 + n),
  brewed_at: `2026-11-1${n}T07:00:00.000Z`,
  bean_id: bean,
  method_id: method,
  recipe_id: recipe,
  recipe_name: name,
  dose_grams: 20,
  ratio: 15,
  steps: [],
  rating: 4,
  taste_words: [],
  rating_note: null,
})

const sample: Backup = {
  kind: 'coffee-backup',
  version: 1,
  exported_at: '2026-11-18T07:42:00.000Z',
  methods: [
    { id: V60, name: 'V60', created_at: '2026-01-01T00:00:00.000Z' },
    { id: AERO, name: 'AeroPress', created_at: '2026-01-02T00:00:00.000Z' },
  ],
  beans: [
    { id: KENYA, name: 'Kenya', finished: false, is_active: true },
    { id: PERU, name: 'Peru', finished: true, is_active: false },
  ],
  recipes: [
    { id: KASUYA, method_id: V60, name: 'Kasuya', ratio: 15, dose_grams: 20, steps: [] },
    { id: INVERTED, method_id: AERO, name: 'Inverted', ratio: 12, dose_grams: 15, steps: [] },
  ],
  brews: [
    brew(1, KENYA, V60, KASUYA, 'Kasuya'),
    brew(2, PERU, AERO, INVERTED, 'Inverted'),
    brew(3, PERU, V60, null, 'Old one'),
  ],
}

const emptySite: SiteNow = { methods: [], beans: [], recipes: [], brews: [] }
const fullSite: SiteNow = {
  methods: sample.methods.map(({ id, name }) => ({ id, name })),
  beans: sample.beans.map(({ id, is_active }) => ({ id, is_active: Boolean(is_active) })),
  recipes: sample.recipes.map(({ id, method_id, name }) => ({ id, method_id, name })),
  brews: sample.brews.map(({ id }) => ({ id })),
}

function plan(file: Backup, site: SiteNow): ImportPlan {
  const result = planImport(file, site)
  if ('problem' in result) throw new Error(`unexpected: ${result.where}`)
  return result
}

describe('planImport', () => {
  it('adds everything to an empty site, bags inactive, the active bag returned', () => {
    const result = plan(sample, emptySite)
    expect(result.add.methods).toHaveLength(2)
    expect(result.add.beans).toHaveLength(2)
    expect(result.add.recipes).toHaveLength(2)
    expect(result.add.brews).toHaveLength(3)
    expect(result.add.beans.every((bean) => bean.is_active === false)).toBe(true)
    expect(result.activeBeanId).toBe(KENYA)
    expect(result.keptCount).toBe(0)
  })
  it('adds nothing when the site has everything', () => {
    const result = plan(sample, fullSite)
    expect(Object.values(result.add).flat()).toHaveLength(0)
    expect(importPreview(result)).toBe('Everything in this backup is already here.')
    expect(result.activeBeanId).toBeNull()
  })
  it('adds only what is missing', () => {
    const site = { ...fullSite, beans: fullSite.beans.slice(0, 1), brews: fullSite.brews.slice(1) }
    const result = plan(sample, site)
    expect(result.add.beans.map((b) => b.id)).toEqual([PERU])
    expect(result.add.brews.map((b) => b.id)).toEqual([id(31)])
    expect(importPreview(result)).toBe('This adds 1 bean and 1 brew. Everything else in it is already here.')
  })
  it('treats a same-name method as the site one', () => {
    const siteV60 = id(91)
    const result = plan(sample, { ...emptySite, methods: [{ id: siteV60, name: 'v60' }] })
    expect(result.add.methods.map((m) => m.id)).toEqual([AERO])
    expect(result.add.recipes.find((r) => r.id === KASUYA)?.method_id).toBe(siteV60)
    expect(result.add.brews.filter((b) => b.method_id === siteV60).map((b) => b.id)).toEqual([id(31), id(33)])
  })
  it('treats a same-name recipe in that method as the site one', () => {
    const siteKasuya = id(92)
    const result = plan(sample, {
      ...emptySite,
      methods: [{ id: V60, name: 'V60' }],
      recipes: [{ id: siteKasuya, method_id: V60, name: 'KASUYA' }],
    })
    expect(result.add.recipes.map((r) => r.id)).toEqual([INVERTED])
    expect(result.add.brews.find((b) => b.id === id(31))?.recipe_id).toBe(siteKasuya)
  })
  it('adds a brew whose recipe is nowhere with no link, keeping its name', () => {
    const file = { ...sample, brews: [brew(4, KENYA, V60, id(99), 'Gone')] }
    const result = plan(file, emptySite)
    expect(result.add.brews[0]).toMatchObject({ recipe_id: null, recipe_name: 'Gone' })
  })
  it('calls a brew whose bean is nowhere damaged', () => {
    const file = { ...sample, brews: [sample.brews[0], brew(5, id(98), V60, null, 'X')] }
    expect(planImport(file, emptySite)).toEqual({ problem: BACKUP_DAMAGED, where: 'brews, row 2' })
  })
  it('calls a recipe whose method is nowhere damaged', () => {
    const file = { ...sample, recipes: [{ ...sample.recipes[0], method_id: id(97) }] }
    expect(planImport(file, emptySite)).toEqual({ problem: BACKUP_DAMAGED, where: 'recipes, row 1' })
  })
  it('never touches the active bag when it should not', () => {
    const other = { id: id(13), is_active: true }
    expect(plan(sample, { ...emptySite, beans: [other] }).activeBeanId).toBeNull()
    expect(plan(sample, { ...emptySite, beans: [{ id: KENYA, is_active: false }] }).activeBeanId).toBeNull()
    const finished = { ...sample, beans: [{ ...sample.beans[0], finished: true }, sample.beans[1]] }
    expect(plan(finished, emptySite).activeBeanId).toBeNull()
  })
})

describe('sentences', () => {
  it('countsSentence leaves out zeros and joins with and', () => {
    expect(countsSentence({ methods: 4, beans: 9, recipes: 12, brews: 412 })).toBe(
      '4 methods, 9 beans, 12 recipes and 412 brews',
    )
    expect(countsSentence({ methods: 0, beans: 1, recipes: 0, brews: 3 })).toBe('1 bean and 3 brews')
    expect(countsSentence({ methods: 0, beans: 0, recipes: 1, brews: 0 })).toBe('1 recipe')
    expect(countsSentence({ methods: 0, beans: 0, recipes: 2, brews: 1412 })).toBe('2 recipes and 1,412 brews')
  })
  it('progressLine', () => {
    expect(progressLine('brews', 500, 1412)).toBe('Adding brews… 500 of 1,412')
  })
  it('doneLine', () => {
    expect(doneLine({ methods: 0, beans: 1, recipes: 0, brews: 3 })).toBe('Done. Added 1 bean and 3 brews.')
  })
  it('addedSoFarLine counts the table that stopped against its total', () => {
    expect(addedSoFarLine({ methods: 4, beans: 9, recipes: 12, brews: 500 }, 'brews', 1412)).toBe(
      'Added so far: 4 methods, 9 beans, 12 recipes and 500 of 1,412 brews. Nothing was lost. Choose the same file again to add the rest.',
    )
    expect(addedSoFarLine({ methods: 0, beans: 0, recipes: 0, brews: 0 }, 'methods', 2)).toBe(
      'Nothing was added yet. Nothing was lost. Choose the same file again to add the rest.',
    )
  })
})

describe('inBatches', () => {
  it('splits into lists of at most the size', () => {
    const rows = Array.from({ length: 1201 }, (_, i) => i)
    expect(inBatches(rows, 500).map((batch) => batch.length)).toEqual([500, 500, 201])
    expect(inBatches([], 500)).toEqual([])
  })
})
