import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PuzzleBoard } from '../components/PuzzleBoard'
import { PuzzlePanel } from '../components/PuzzlePanel'
import { getCategory, loadPuzzles } from '../lib/puzzles'
import {
  loadAutoSkip,
  loadProgress,
  saveAutoSkip,
  saveProgress,
} from '../lib/progress'
import type { Puzzle, PuzzleStatus } from '../types'

export function PuzzlePage() {
  const { slug = '' } = useParams()
  const category = getCategory(slug)
  const [puzzles, setPuzzles] = useState<Puzzle[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setPuzzles(null)
    setFailed(false)
    if (!category) {
      setFailed(true)
      return
    }
    loadPuzzles(slug)
      .then((data) => {
        if (!cancelled) setPuzzles(data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [slug, category])

  if (!category || failed) {
    return <Navigate to="/" replace />
  }

  if (!puzzles) {
    return (
      <div className="flex min-h-full items-center justify-center text-[var(--muted)]">
        Loading…
      </div>
    )
  }

  if (puzzles.length === 0) {
    return <Navigate to="/" replace />
  }

  return <PuzzleTrainer puzzles={puzzles} slug={slug} />
}

function PuzzleTrainer({
  puzzles,
  slug,
}: {
  puzzles: Puzzle[]
  slug: string
}) {
  const initial = useMemo(
    () => loadProgress(slug, puzzles.length),
    [slug, puzzles.length],
  )
  const [index, setIndex] = useState(initial.currentIndex)
  const [solvedIds, setSolvedIds] = useState<number[]>(initial.solvedIds)
  const [status, setStatus] = useState<PuzzleStatus>('playing')
  const [shake, setShake] = useState(false)
  const [hintSquare, setHintSquare] = useState<string | null>(null)
  const [plyIndex, setPlyIndex] = useState(0)
  const [resetToken, setResetToken] = useState(0)
  const [autoSkip, setAutoSkip] = useState(() => loadAutoSkip())
  const autoSkipRef = useRef(autoSkip)
  autoSkipRef.current = autoSkip
  const indexRef = useRef(index)
  indexRef.current = index
  const autoNextTimer = useRef<number | null>(null)

  const puzzle = puzzles[index]

  useEffect(() => {
    const saved = loadProgress(slug, puzzles.length)
    setIndex(saved.currentIndex)
    setSolvedIds(saved.solvedIds)
  }, [slug, puzzles.length])

  useEffect(() => {
    saveProgress(slug, { currentIndex: index, solvedIds })
  }, [slug, index, solvedIds])

  useEffect(() => {
    if (autoNextTimer.current) {
      window.clearTimeout(autoNextTimer.current)
      autoNextTimer.current = null
    }
    setStatus('playing')
    setHintSquare(null)
    setShake(false)
    setPlyIndex(0)
  }, [index, slug])

  useEffect(() => {
    return () => {
      if (autoNextTimer.current) window.clearTimeout(autoNextTimer.current)
    }
  }, [])

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= puzzles.length) return
      setIndex(next)
    },
    [puzzles.length],
  )

  const onNext = useCallback(() => {
    const current = indexRef.current
    if (current < puzzles.length - 1) goTo(current + 1)
  }, [puzzles.length, goTo])

  const onSolved = useCallback(() => {
    setStatus('correct')
    setSolvedIds((prev) =>
      prev.includes(puzzle.id) ? prev : [...prev, puzzle.id],
    )
    if (autoSkipRef.current) {
      if (autoNextTimer.current) window.clearTimeout(autoNextTimer.current)
      autoNextTimer.current = window.setTimeout(() => {
        autoNextTimer.current = null
        onNext()
      }, 650)
    }
  }, [puzzle.id, onNext])

  const onIncorrect = useCallback(() => {
    setStatus('incorrect')
    setShake(true)
    window.setTimeout(() => {
      setShake(false)
      setStatus('playing')
      setPlyIndex(0)
    }, 550)
  }, [])

  const onPrev = useCallback(() => {
    if (index > 0) goTo(index - 1)
  }, [index, goTo])

  const onReset = useCallback(() => {
    setStatus('playing')
    setHintSquare(null)
    setPlyIndex(0)
    setResetToken((t) => t + 1)
  }, [])

  const onHint = useCallback(() => {
    const move = puzzle.moves[plyIndex]
    setHintSquare(move?.from ?? null)
  }, [puzzle.moves, plyIndex])

  const onAutoSkipChange = useCallback((value: boolean) => {
    setAutoSkip(value)
    saveAutoSkip(value)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNext()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'Enter' && status === 'correct') onNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status, onNext, onPrev])

  return (
    <div className="min-h-full px-4 py-6 md:px-8">
      <div className="mb-4 md:hidden">
        <Link to="/" className="text-sm text-[var(--muted)] no-underline">
          ← Back
        </Link>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
        <PuzzleBoard
          puzzle={puzzle}
          status={status}
          onStatusChange={setStatus}
          onSolved={onSolved}
          onIncorrect={onIncorrect}
          onPlyChange={setPlyIndex}
          shake={shake}
          resetToken={resetToken}
        />
        <PuzzlePanel
          puzzle={puzzle}
          index={index}
          total={puzzles.length}
          solvedCount={solvedIds.length}
          status={status}
          autoSkip={autoSkip}
          onAutoSkipChange={onAutoSkipChange}
          onNext={onNext}
          onPrev={onPrev}
          onReset={onReset}
          onHint={onHint}
          onJump={goTo}
          hintSquare={hintSquare}
        />
      </div>
    </div>
  )
}
