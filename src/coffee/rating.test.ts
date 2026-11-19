import { describe, expect, it } from 'vitest'
import { checkRating, needsRating, ratingLabel, ratingToForm, toggleTasteWord } from './rating'

const blank = { rating: null, words: [], noteText: '' }

describe('toggleTasteWord', () => {
  it('adds in the fixed order and removes', () => {
    const two = toggleTasteWord(toggleTasteWord([], 'weak'), 'sour')
    expect(two).toEqual(['sour', 'weak'])
    expect(toggleTasteWord(two, 'sour')).toEqual(['weak'])
  })
  it('never repeats a word', () => {
    expect(toggleTasteWord(['weak', 'weak'], 'sour')).toEqual(['sour', 'weak'])
  })
})

describe('checkRating', () => {
  it('needs dots first', () => {
    expect(checkRating(blank)).toEqual({ ok: false, errors: { rating: 'Choose 1 to 5 dots first.' } })
  })
  it('accepts dots alone', () => {
    expect(checkRating({ ...blank, rating: 4 })).toEqual({
      ok: true,
      values: { rating: 4, taste_words: [], rating_note: null },
    })
  })
  it('trims the note', () => {
    const result = checkRating({ ...blank, rating: 3, noteText: '  nice  ' })
    expect(result.ok && result.values.rating_note).toBe('nice')
  })
  it('keeps the note to 300 characters', () => {
    expect(checkRating({ ...blank, rating: 3, noteText: 'a'.repeat(300) }).ok).toBe(true)
    expect(checkRating({ ...blank, rating: 3, noteText: 'a'.repeat(301) })).toEqual({
      ok: false,
      errors: { note: 'Keep it to 300 characters.' },
    })
  })
  it('drops unknown words and fixes the order', () => {
    const result = checkRating({ rating: 2, words: ['weak', 'fruity', 'sour'], noteText: '' })
    expect(result.ok && result.values.taste_words).toEqual(['sour', 'weak'])
  })
  it('refuses a rating outside 1 to 5', () => {
    expect(checkRating({ ...blank, rating: 6 }).ok).toBe(false)
    expect(checkRating({ ...blank, rating: 0 }).ok).toBe(false)
  })
})

describe('ratingToForm', () => {
  it('round-trips a rated brew', () => {
    const saved = { rating: 2, taste_words: ['bitter' as const, 'strong' as const], rating_note: 'grind finer' }
    expect(checkRating(ratingToForm(saved))).toEqual({ ok: true, values: saved })
  })
})

describe('ratingLabel', () => {
  it('reads out the rating', () => {
    expect(ratingLabel(4)).toBe('Rated 4 out of 5')
    expect(ratingLabel(null)).toBe('Not rated yet')
  })
})

describe('needsRating', () => {
  it('only for an unrated brew', () => {
    expect(needsRating({ rating: null })).toBe(true)
    expect(needsRating({ rating: 3 })).toBe(false)
    expect(needsRating(null)).toBe(false)
  })
})
