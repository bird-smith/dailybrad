import { describe, expect, it } from 'vitest'
import type { DataResult } from '../lib/dataResult'
import { readAllPages } from './backupData'

function fakeTable(total: number, cap: number) {
  const rows = Array.from({ length: total }, (_, i) => i)
  const asked: [number, number][] = []
  const fetchPage = async (from: number, to: number): Promise<DataResult<number[]>> => {
    asked.push([from, to])
    return { ok: true, data: rows.slice(from, Math.min(to + 1, from + cap)) }
  }
  return { rows, asked, fetchPage }
}

describe('readAllPages', () => {
  it('reads until an empty page, in order', async () => {
    const table = fakeTable(2412, 1000)
    const result = await readAllPages(table.fetchPage)
    expect(result).toEqual({ ok: true, data: table.rows })
    expect(table.asked).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
      [2412, 3411],
    ])
  })
  it('still gets every row when the database gives fewer per page', async () => {
    const table = fakeTable(1201, 500)
    expect(await readAllPages(table.fetchPage)).toEqual({ ok: true, data: table.rows })
  })
  it('returns the error and no rows when a page fails', async () => {
    let calls = 0
    const error = { status: 0, message: 'Failed to fetch' }
    const fetchPage = async (): Promise<DataResult<number[]>> =>
      ++calls === 2 ? { ok: false, error } : { ok: true, data: Array.from({ length: 1000 }, () => 1) }
    expect(await readAllPages(fetchPage)).toEqual({ ok: false, error })
  })
})
