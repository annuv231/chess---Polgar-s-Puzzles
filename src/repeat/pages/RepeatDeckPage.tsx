import { Link, Navigate, useParams } from 'react-router-dom'
import { DeckDetailActions } from '@repeat/components/DeckDetailActions'
import { DeckLineList } from '@repeat/components/DeckLineList'
import { getDeckBySlug } from '@repeat/decks'

export function RepeatDeckPage() {
  const { slug = '' } = useParams()
  const deck = getDeckBySlug(slug)
  if (!deck) return <Navigate to="/repeat" replace />

  const side = deck.color === 'w' ? 'White' : 'Black'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        to="/repeat"
        className="text-sm text-stone-500 no-underline hover:text-stone-800 dark:hover:text-stone-200"
      >
        ← All decks
      </Link>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {deck.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium capitalize dark:bg-stone-800"
              >
                {tag}
              </span>
            ))}
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Train as {side}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{deck.name}</h1>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            {deck.lines.length} {deck.lines.length === 1 ? 'line' : 'lines'} ·{' '}
            {deck.lines.reduce((n, line) => n + line.steps.length, 0)} moves to
            learn
          </p>
          <DeckLineList deck={deck} />
        </div>
        <DeckDetailActions deck={deck} />
      </div>
    </div>
  )
}
