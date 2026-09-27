import { Link } from 'react-router-dom'

const apps = [
  {
    to: '/puzzles',
    title: "Chess Polgár's Puzzle",
    subtitle: '4,462 mate-in-1, 2, and 3 puzzles',
    badge: 'P',
  },
  {
    to: '/repeat',
    title: 'Chess Repeat',
    subtitle: 'Learn openings with spaced repetition',
    badge: 'R',
  },
]

export function HubPage() {
  return (
    <div className="min-h-full px-4 py-10 md:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Chess Practice
          </h1>
          <p className="mt-3 text-[var(--muted)]">Choose what you want to train.</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {apps.map((app) => (
            <Link
              key={app.to}
              to={app.to}
              className="block rounded-lg bg-[var(--panel)] p-6 text-inherit no-underline shadow-lg transition hover:-translate-y-0.5 hover:bg-[#2c2a28]"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-[#1f1e1c] text-xl font-bold text-[var(--accent)]">
                {app.badge}
              </div>
              <h2 className="text-2xl font-bold">{app.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{app.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
