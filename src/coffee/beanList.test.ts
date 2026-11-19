import { describe, expect, it } from 'vitest'
import { sortBeans, splitFinished } from './beanList'
import type { Bean } from './types'

function bean(name: string, changes: Partial<Bean> = {}): Bean {
  return {
    id: name,
    name,
    roaster: null,
    roast_date: null,
    bag_grams: null,
    cost_cents: null,
    region: null,
    process: null,
    varietal: null,
    notes: null,
    finished: false,
    is_active: false,
    created_at: '',
    ...changes,
  }
}

describe('sortBeans', () => {
  it('puts active first, then newest roast, then undated, ties by name', () => {
    const beans = [
      bean('Undated B'),
      bean('Old', { roast_date: '2026-10-01' }),
      bean('undated a'),
      bean('New', { roast_date: '2026-11-10' }),
      bean('Active', { roast_date: '2026-09-01', is_active: true }),
      bean('Also new', { roast_date: '2026-11-10' }),
    ]
    expect(sortBeans(beans).map((b) => b.name)).toEqual([
      'Active',
      'Also new',
      'New',
      'Old',
      'undated a',
      'Undated B',
    ])
  })
})

describe('splitFinished', () => {
  it('separates finished bags', () => {
    const { inUse, finished } = splitFinished([
      bean('Done', { finished: true, roast_date: '2026-11-17' }),
      bean('Open', { roast_date: '2026-01-01' }),
    ])
    expect(inUse.map((b) => b.name)).toEqual(['Open'])
    expect(finished.map((b) => b.name)).toEqual(['Done'])
  })
})
