import { Chess, type Square } from 'chess.js'
import type { SquareMove } from '../types'

export function movesMatch(a: SquareMove, b: SquareMove) {
  if (a.from !== b.from || a.to !== b.to) return false
  const ap = a.promotion ?? 'q'
  const bp = b.promotion ?? 'q'
  // if either specifies promotion, compare; for non-promotions both undefined → ok
  if (a.promotion || b.promotion) return ap === bp
  return true
}

export function tryMove(fen: string, move: SquareMove) {
  const game = new Chess(fen)
  try {
    const opts: {
      from: Square
      to: Square
      promotion?: 'q' | 'r' | 'b' | 'n'
    } = {
      from: move.from as Square,
      to: move.to as Square,
    }
    const piece = game.get(move.from as Square)
    const needsPromo =
      piece?.type === 'p' && (move.to[1] === '8' || move.to[1] === '1')
    if (needsPromo) {
      opts.promotion = move.promotion ?? 'q'
    }
    const result = game.move(opts)
    if (!result) return null
    return {
      move: result,
      fen: game.fen(),
      isCheckmate: game.isCheckmate(),
      promotion: opts.promotion,
    }
  } catch {
    return null
  }
}

export function getLegalTargets(fen: string, from: string): string[] {
  const game = new Chess(fen)
  return game
    .moves({ square: from as Square, verbose: true })
    .map((m) => m.to)
}

export function squareHasOwnPiece(
  fen: string,
  square: string,
  side: 'w' | 'b',
) {
  const game = new Chess(fen)
  const piece = game.get(square as Square)
  return Boolean(piece && piece.color === side)
}

export function needsPromotion(fen: string, from: string, to: string) {
  const game = new Chess(fen)
  const piece = game.get(from as Square)
  return Boolean(
    piece?.type === 'p' && (to[1] === '8' || to[1] === '1'),
  )
}

export function turnFromFen(fen: string): 'w' | 'b' {
  return fen.split(' ')[1] as 'w' | 'b'
}
