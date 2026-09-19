export type SquareMove = {
  from: string
  to: string
  promotion?: 'q' | 'r' | 'b' | 'n'
}

export type Puzzle = {
  id: number
  fen: string
  moves: SquareMove[]
  side: 'w' | 'b'
}

export type CategoryMeta = {
  slug: string
  title: string
  subtitle: string
  count: number
  mateIn: number | null
  badge: string
}

export type PuzzleStatus = 'playing' | 'correct' | 'incorrect' | 'waiting'

export type ProgressState = {
  currentIndex: number
  solvedIds: number[]
}
