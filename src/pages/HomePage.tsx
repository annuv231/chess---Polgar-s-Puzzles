import { Link } from 'react-router-dom'
import { categories } from '../lib/puzzles'
import { peekSolvedCount } from '../lib/progress'

export function HomePage() {
  const practiceCategories = categories.filter((c) => c.slug !== 'remix')
  const total = practiceCategories.reduce((sum, c) => sum + c.count, 0)
  const solvedTotal = practiceCategories.reduce(
    (sum, c) => sum + peekSolvedCount(c.slug),
    0,
  )

  return (
    <div className="min-h-full px-4 py-10 md:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10">
          <Link
            to="/"
            className="text-sm text-[var(--muted)] no-underline hover:text-white"
          >
            ← Home
          </Link>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Chess Polgár&apos;s Puzzle
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            {solvedTotal} / {total} solved
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((category) => {
            const solved = peekSolvedCount(category.slug)
            const pct = Math.round((solved / category.count) * 100)
            return (
              <Link
                key={category.slug}
                to={`/play/${category.slug}`}
                className="group block rounded-lg bg-[var(--panel)] p-5 text-inherit no-underline shadow-lg transition hover:-translate-y-0.5 hover:bg-[#2c2a28]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-[#1f1e1c] text-xl font-bold text-[var(--accent)]">
                  {category.badge}
                </div>
                <h2 className="text-xl font-bold">{category.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {category.subtitle}
                </p>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-[var(--muted)]">
                    <span>{category.count.toLocaleString()} puzzles</span>
                    <span>
                      {solved} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#1f1e1c]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
