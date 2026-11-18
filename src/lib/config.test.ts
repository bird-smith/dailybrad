import { describe, expect, it } from 'vitest'
import { readConfig } from './config'

const URL = 'https://abc.supabase.co'
const KEY = 'sb_publishable_123'

describe('readConfig', () => {
  it('returns both values when both are present', () => {
    expect(
      readConfig({ VITE_SUPABASE_URL: URL, VITE_SUPABASE_PUBLISHABLE_KEY: KEY }),
    ).toEqual({ ok: true, url: URL, publishableKey: KEY })
  })

  it('names the one setting that is missing', () => {
    expect(readConfig({ VITE_SUPABASE_URL: URL })).toEqual({
      ok: false,
      missing: ['VITE_SUPABASE_PUBLISHABLE_KEY'],
    })
  })

  it('names both settings when both are missing', () => {
    expect(readConfig({})).toEqual({
      ok: false,
      missing: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
    })
  })

  it('counts blank or spaces-only as missing', () => {
    expect(
      readConfig({ VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '   ' }),
    ).toEqual({
      ok: false,
      missing: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
    })
  })

  it('trims surrounding spaces', () => {
    expect(
      readConfig({ VITE_SUPABASE_URL: ` ${URL} `, VITE_SUPABASE_PUBLISHABLE_KEY: `${KEY}\n` }),
    ).toEqual({ ok: true, url: URL, publishableKey: KEY })
  })
})
