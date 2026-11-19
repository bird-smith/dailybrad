import { checkShortText } from './recipeForm'
import { TASTE_WORDS, type Brew, type RatingValues, type TasteWord } from './types'

export const NOTE_MAX = 300

export type RatingForm = { rating: number | null; words: string[]; noteText: string }
export type RatingErrors = { rating?: string; note?: string }

/** Only known words, each once, in the fixed order. */
const tidy = (words: string[]): TasteWord[] => TASTE_WORDS.filter((word) => words.includes(word))

/** Adds or removes one word. */
export function toggleTasteWord(words: string[], word: TasteWord): TasteWord[] {
  return words.includes(word) ? tidy(words.filter((w) => w !== word)) : tidy([...words, word])
}

export function checkRating(form: RatingForm): { ok: true; values: RatingValues } | { ok: false; errors: RatingErrors } {
  const errors: RatingErrors = {}
  const { rating } = form
  if (rating === null || !Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Choose 1 to 5 dots first.'
  const note = checkShortText(form.noteText, NOTE_MAX)
  if (!note.ok) errors.note = note.message
  if (errors.rating || !note.ok) return { ok: false, errors }
  return { ok: true, values: { rating, taste_words: tidy(form.words), rating_note: note.value } }
}

/** The form filled from a saved brew, for Change rating. */
export function ratingToForm(brew: RatingValues): RatingForm {
  return { rating: brew.rating, words: [...brew.taste_words], noteText: brew.rating_note ?? '' }
}

export function ratingLabel(rating: number | null): string {
  return rating === null ? 'Not rated yet' : `Rated ${rating} out of 5`
}

/** Only a brew with no rating; never with no brew at all. */
export function needsRating(brew: Pick<Brew, 'rating'> | null): boolean {
  return brew !== null && brew.rating === null
}
