import { ratingLabel } from './rating'

const DOTS = [1, 2, 3, 4, 5]

// Five round dots: filled copper up to the rating, thin rings after. With onChoose, each
// dot is a 48px tap target; without, they're small and only show.
export default function RatingDots({ rating, onChoose }: { rating: number | null; onChoose?: (rating: number) => void }) {
  const dot = (n: number, size: string) =>
    `block rounded-full ${size} ${rating !== null && n <= rating ? 'bg-accent' : 'border border-muted'}`

  if (!onChoose) {
    return (
      <span role="img" aria-label={ratingLabel(rating)} className="inline-flex shrink-0 items-center gap-1">
        {DOTS.map((n) => (
          <span key={n} className={dot(n, 'size-2')} />
        ))}
      </span>
    )
  }

  return (
    <div role="radiogroup" aria-label="Rating" className="flex">
      {DOTS.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={rating === n}
          aria-label={`${n} out of 5`}
          onClick={() => onChoose(n)}
          className="press flex size-12 items-center justify-center"
        >
          <span className={dot(n, 'size-6')} />
        </button>
      ))}
    </div>
  )
}
