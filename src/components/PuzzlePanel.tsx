import { Link } from 'react-router-dom'
import { mateInFromPuzzle } from '../lib/puzzles'
import type { Puzzle, PuzzleStatus } from '../types'

type Props = {
  puzzle: Puzzle
  index: number
  total: number
  solvedCount: number
  status: PuzzleStatus
  autoSkip: boolean
  onAutoSkipChange: (value: boolean) => void
  onNext: () => void
  onPrev: () => void
  onReset: () => void
  onHint: () => void
  onJump: (index: number) => void
  hintSquare: string | null
}

export function PuzzlePanel({
  puzzle,
  index,
  total,
  solvedCount,
  status,
  autoSkip,
  onAutoSkipChange,
  onNext,
  onPrev,
  onReset,
  onHint,
  onJump,
  hintSquare,
}: Props) {
  const mateIn = mateInFromPuzzle(puzzle)

  return (
    <aside className="flex w-full max-w-sm flex-col gap-3 rounded-md bg-[var(--panel)] p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/"
          className="text-sm text-[var(--muted)] no-underline hover:text-white"
        >
          ← Back
        </Link>
        <p className="text-sm text-[var(--muted)]">
          #{puzzle.id} · {puzzle.side === 'w' ? 'White' : 'Black'} · M{mateIn}
        </p>
      </div>

      <Feedback status={status} hintSquare={hintSquare} />

      <div className="flex flex-wrap gap-2">
        {status === 'correct' && !autoSkip ? (
          <button type="button" className="btn-primary flex-1" onClick={onNext}>
            Next
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={onHint}
              disabled={status === 'waiting' || status === 'correct'}
            >
              Hint
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onReset}
              disabled={status === 'correct'}
            >
              Reset
            </button>
          </>
        )}
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md bg-[#1f1e1c] px-3 py-2.5 text-sm">
        <span>Auto-next</span>
        <input
          type="checkbox"
          checked={autoSkip}
          onChange={(e) => onAutoSkipChange(e.target.checked)}
          className="h-4 w-4 accent-[var(--accent)]"
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={onPrev}
          disabled={index === 0}
        >
          Prev
        </button>
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.currentTarget
            const value = Number(
              (form.elements.namedItem('jump') as HTMLInputElement).value,
            )
            if (!Number.isFinite(value)) return
            onJump(value - 1)
          }}
        >
          <input
            name="jump"
            type="number"
            min={1}
            max={total}
            defaultValue={index + 1}
            key={index}
            className="w-full rounded border border-[#3d3b39] bg-[#1f1e1c] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            aria-label="Jump to puzzle number"
          />
          <button type="submit" className="btn-secondary">
            Go
          </button>
        </form>
        <button
          type="button"
          className="btn-secondary"
          onClick={onNext}
          disabled={index >= total - 1}
        >
          Next
        </button>
      </div>

      <div className="border-t border-[#3d3b39] pt-3 text-sm text-[var(--muted)]">
        <div className="mb-2 flex justify-between">
          <span>
            {index + 1} / {total}
          </span>
          <span>{solvedCount} solved</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[#1f1e1c]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${(solvedCount / Math.max(total, 1)) * 100}%` }}
          />
        </div>
      </div>
    </aside>
  )
}

function Feedback({
  status,
  hintSquare,
}: {
  status: PuzzleStatus
  hintSquare: string | null
}) {
  if (status === 'correct') {
    return (
      <div className="fade-in rounded-md bg-[#365314]/70 px-3 py-2 text-sm font-semibold text-[var(--correct)]">
        Correct
      </div>
    )
  }

  if (status === 'incorrect') {
    return (
      <div className="fade-in rounded-md bg-[#5c1f1e]/70 px-3 py-2 text-sm font-semibold text-[#ff8f8c]">
        Incorrect
      </div>
    )
  }

  if (hintSquare) {
    return (
      <div className="rounded-md bg-[#1f1e1c] px-3 py-2 text-sm text-[var(--muted)]">
        Hint: {hintSquare.toUpperCase()}
      </div>
    )
  }

  return null
}
