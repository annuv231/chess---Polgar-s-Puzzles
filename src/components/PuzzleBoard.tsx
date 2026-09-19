import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Chessboard } from 'react-chessboard'
import type {
  PieceDropHandlerArgs,
  PieceHandlerArgs,
  SquareHandlerArgs,
} from 'react-chessboard'
import type { Puzzle, PuzzleStatus, SquareMove } from '../types'
import {
  getLegalTargets,
  movesMatch,
  needsPromotion,
  squareHasOwnPiece,
  tryMove,
  turnFromFen,
} from '../lib/chessHelpers'

type Props = {
  puzzle: Puzzle
  status: PuzzleStatus
  onStatusChange: (status: PuzzleStatus) => void
  onSolved: () => void
  onIncorrect: () => void
  onPlyChange?: (plyIndex: number) => void
  shake: boolean
  resetToken?: number
}

const LIGHT = '#ebecd0'
const DARK = '#739552'
const SELECT = 'rgba(255, 255, 0, 0.45)'
const LEGAL = 'rgba(0, 0, 0, 0.18)'
const LEGAL_CAPTURE = 'rgba(0, 0, 0, 0.22)'
const CORRECT_FROM = 'rgba(155, 199, 0, 0.55)'
const CORRECT_TO = 'rgba(155, 199, 0, 0.75)'
const WRONG_FROM = 'rgba(235, 97, 80, 0.55)'
const WRONG_TO = 'rgba(235, 97, 80, 0.75)'

export function PuzzleBoard({
  puzzle,
  status,
  onStatusChange,
  onSolved,
  onIncorrect,
  onPlyChange,
  shake,
  resetToken = 0,
}: Props) {
  const [fen, setFen] = useState(puzzle.fen)
  const [plyIndex, setPlyIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [legalTargets, setLegalTargets] = useState<string[]>([])
  const [lastMove, setLastMove] = useState<SquareMove | null>(null)
  const [feedbackMove, setFeedbackMove] = useState<{
    move: SquareMove
    ok: boolean
  } | null>(null)
  const [pendingPromo, setPendingPromo] = useState<{
    from: string
    to: string
  } | null>(null)

  const fenRef = useRef(fen)
  const plyRef = useRef(plyIndex)
  fenRef.current = fen
  plyRef.current = plyIndex

  const playerSide = puzzle.side
  const activeSide = turnFromFen(fen)

  useEffect(() => {
    setFen(puzzle.fen)
    setPlyIndex(0)
    setSelected(null)
    setLegalTargets([])
    setLastMove(null)
    setFeedbackMove(null)
    setPendingPromo(null)
    onPlyChange?.(0)
  }, [puzzle.id, puzzle.fen, resetToken, onPlyChange])

  const clearSelection = useCallback(() => {
    setSelected(null)
    setLegalTargets([])
  }, [])

  const resetPosition = useCallback(() => {
    setFen(puzzle.fen)
    setPlyIndex(0)
    setLastMove(null)
    setFeedbackMove(null)
    setPendingPromo(null)
    clearSelection()
    onPlyChange?.(0)
  }, [puzzle.fen, clearSelection, onPlyChange])

  const playLineMove = useCallback(
    (currentFen: string, move: SquareMove) => {
      const result = tryMove(currentFen, move)
      if (!result) return null
      return result
    },
    [],
  )

  const applyPlayerMove = useCallback(
    (from: string, to: string, promotion?: SquareMove['promotion']) => {
      if (status === 'correct' || status === 'waiting') return false
      if (turnFromFen(fenRef.current) !== playerSide) return false

      if (!promotion && needsPromotion(fenRef.current, from, to)) {
        setPendingPromo({ from, to })
        clearSelection()
        return false
      }

      const attempt: SquareMove = { from, to, promotion }
      const expected = puzzle.moves[plyRef.current]
      if (!expected) return false

      const result = playLineMove(fenRef.current, attempt)
      if (!result) return false

      const ok = movesMatch(
        {
          from,
          to,
          promotion: result.promotion ?? promotion,
        },
        expected,
      )

      setFen(result.fen)
      setLastMove(attempt)
      setFeedbackMove({ move: attempt, ok })
      clearSelection()
      setPendingPromo(null)

      if (!ok) {
        onIncorrect()
        window.setTimeout(() => {
          resetPosition()
        }, 550)
        return true
      }

      const nextPly = plyRef.current + 1

      if (nextPly >= puzzle.moves.length) {
        setPlyIndex(nextPly)
        onPlyChange?.(nextPly)
        onSolved()
        return true
      }

      // Opponent reply
      setPlyIndex(nextPly)
      onPlyChange?.(nextPly)
      onStatusChange('waiting')
      const reply = puzzle.moves[nextPly]
      const afterPlayerFen = result.fen

      window.setTimeout(() => {
        const replyResult = playLineMove(afterPlayerFen, reply)
        if (!replyResult) {
          resetPosition()
          onStatusChange('playing')
          onPlyChange?.(0)
          return
        }
        setFen(replyResult.fen)
        setLastMove(reply)
        setFeedbackMove(null)
        setPlyIndex(nextPly + 1)
        onPlyChange?.(nextPly + 1)
        onStatusChange('playing')
      }, 350)

      return true
    },
    [
      status,
      playerSide,
      puzzle.moves,
      playLineMove,
      clearSelection,
      onIncorrect,
      onSolved,
      onStatusChange,
      onPlyChange,
      resetPosition,
    ],
  )

  const selectSquare = useCallback(
    (square: string) => {
      if (status !== 'playing' || pendingPromo) return
      if (activeSide !== playerSide) return

      if (selected) {
        if (selected === square) {
          clearSelection()
          return
        }
        if (legalTargets.includes(square)) {
          applyPlayerMove(selected, square)
          return
        }
        if (squareHasOwnPiece(fen, square, playerSide)) {
          setSelected(square)
          setLegalTargets(getLegalTargets(fen, square))
          return
        }
        clearSelection()
        return
      }

      if (squareHasOwnPiece(fen, square, playerSide)) {
        setSelected(square)
        setLegalTargets(getLegalTargets(fen, square))
      }
    },
    [
      status,
      pendingPromo,
      activeSide,
      playerSide,
      selected,
      legalTargets,
      fen,
      applyPlayerMove,
      clearSelection,
    ],
  )

  const onPieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
      if (!targetSquare || status !== 'playing') return false
      return applyPlayerMove(sourceSquare, targetSquare)
    },
    [applyPlayerMove, status],
  )

  const canDragPiece = useCallback(
    ({ square }: PieceHandlerArgs) => {
      if (status !== 'playing' || pendingPromo || !square) return false
      if (activeSide !== playerSide) return false
      return squareHasOwnPiece(fen, square, playerSide)
    },
    [status, pendingPromo, activeSide, playerSide, fen],
  )

  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {}

    if (feedbackMove) {
      styles[feedbackMove.move.from] = {
        backgroundColor: feedbackMove.ok ? CORRECT_FROM : WRONG_FROM,
      }
      styles[feedbackMove.move.to] = {
        backgroundColor: feedbackMove.ok ? CORRECT_TO : WRONG_TO,
      }
    } else if (lastMove) {
      styles[lastMove.from] = { backgroundColor: CORRECT_FROM }
      styles[lastMove.to] = { backgroundColor: CORRECT_TO }
    }

    if (selected) {
      styles[selected] = { backgroundColor: SELECT }
      for (const target of legalTargets) {
        const isCapture = squareHasOwnPiece(
          fen,
          target,
          playerSide === 'w' ? 'b' : 'w',
        )
        styles[target] = {
          backgroundImage: isCapture
            ? `radial-gradient(circle, transparent 58%, ${LEGAL_CAPTURE} 60%)`
            : `radial-gradient(circle, ${LEGAL} 22%, transparent 23%)`,
          backgroundColor: styles[target]?.backgroundColor,
        }
      }
    }

    return styles
  }, [feedbackMove, lastMove, selected, legalTargets, fen, playerSide])

  const boardWidth = useBoardWidth()

  return (
    <div
      className={shake ? 'board-shake' : undefined}
      style={{ width: boardWidth, maxWidth: '100%', position: 'relative' }}
    >
      <Chessboard
        options={{
          id: 'puzzle-board',
          position: fen,
          boardOrientation: playerSide === 'w' ? 'white' : 'black',
          allowDragging: status === 'playing' && !pendingPromo,
          allowDrawingArrows: true,
          animationDurationInMs: 180,
          boardStyle: {
            width: '100%',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          },
          lightSquareStyle: { backgroundColor: LIGHT },
          darkSquareStyle: { backgroundColor: DARK },
          squareStyles,
          canDragPiece,
          onPieceDrop,
          onSquareClick: ({ square }: SquareHandlerArgs) =>
            selectSquare(square),
          onPieceClick: ({ square }: PieceHandlerArgs) => {
            if (square) selectSquare(square)
          },
        }}
      />

      {pendingPromo && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/45">
          <div className="flex gap-2 rounded-md bg-[var(--panel)] p-3 shadow-xl">
            {(['q', 'r', 'b', 'n'] as const).map((piece) => (
              <button
                key={piece}
                type="button"
                className="btn-secondary min-w-14 text-2xl"
                onClick={() =>
                  applyPlayerMove(pendingPromo.from, pendingPromo.to, piece)
                }
              >
                {promoGlyph(piece, playerSide)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function promoGlyph(piece: 'q' | 'r' | 'b' | 'n', side: 'w' | 'b') {
  const map =
    side === 'w'
      ? { q: '♕', r: '♖', b: '♗', n: '♘' }
      : { q: '♛', r: '♜', b: '♝', n: '♞' }
  return map[piece]
}

function useBoardWidth() {
  const [width, setWidth] = useState(560)

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      if (vw < 900) {
        setWidth(Math.min(vw - 32, vh - 220))
      } else {
        setWidth(Math.min(640, vh - 80))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return width
}
