import type { CategoryMeta, Puzzle } from '../types'
import categoriesJson from '../data/categories.json'

export const categories = categoriesJson as CategoryMeta[]

const loaders: Record<string, () => Promise<Puzzle[]>> = {
  'mate-in-one': () =>
    import('../data/mate-in-one.json').then((m) => m.default as Puzzle[]),
  'mate-in-two': () =>
    import('../data/mate-in-two.json').then((m) => m.default as Puzzle[]),
  'mate-in-three': () =>
    import('../data/mate-in-three.json').then((m) => m.default as Puzzle[]),
}

const cache = new Map<string, Puzzle[]>()

const REMIX_ORDER_KEY = 'chess-practice:remix-order'

function shuffleIds(ids: number[]) {
  const arr = [...ids]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

async function loadRemix(): Promise<Puzzle[]> {
  const [one, two, three] = await Promise.all([
    loaders['mate-in-one'](),
    loaders['mate-in-two'](),
    loaders['mate-in-three'](),
  ])
  const all = [...one, ...two, ...three]
  const byId = new Map(all.map((p) => [p.id, p]))

  let order: number[] | null = null
  try {
    const raw = localStorage.getItem(REMIX_ORDER_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (
        Array.isArray(parsed) &&
        parsed.length === all.length &&
        parsed.every((id) => Number.isInteger(id) && byId.has(id))
      ) {
        order = parsed as number[]
      }
    }
  } catch {
    order = null
  }

  if (!order) {
    order = shuffleIds(all.map((p) => p.id))
    try {
      localStorage.setItem(REMIX_ORDER_KEY, JSON.stringify(order))
    } catch {
      // ignore quota
    }
  }

  return order.map((id) => byId.get(id)).filter(Boolean) as Puzzle[]
}

export function reshuffleRemix() {
  localStorage.removeItem(REMIX_ORDER_KEY)
  cache.delete('remix')
}

export function getCategory(slug: string): CategoryMeta | undefined {
  return categories.find((c) => c.slug === slug)
}

export async function loadPuzzles(slug: string): Promise<Puzzle[]> {
  if (cache.has(slug)) return cache.get(slug)!

  if (slug === 'remix') {
    const puzzles = await loadRemix()
    cache.set(slug, puzzles)
    return puzzles
  }

  const loader = loaders[slug]
  if (!loader) return []
  const puzzles = await loader()
  cache.set(slug, puzzles)
  return puzzles
}

export function mateInFromPuzzle(puzzle: Puzzle) {
  return Math.ceil(puzzle.moves.length / 2)
}
