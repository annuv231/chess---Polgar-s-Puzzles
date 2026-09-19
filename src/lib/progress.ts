import type { ProgressState } from '../types'

function keyFor(categorySlug: string) {
  return `chess-practice:${categorySlug}`
}

const AUTO_SKIP_KEY = 'chess-practice:auto-skip'

function isSafeSlug(slug: string) {
  return /^[a-z0-9-]{1,64}$/.test(slug)
}

function sanitizeProgress(raw: unknown, total: number): ProgressState {
  const empty: ProgressState = { currentIndex: 0, solvedIds: [] }
  if (!raw || typeof raw !== 'object') return empty

  const parsed = raw as Partial<ProgressState>
  const currentIndex = Math.min(
    Math.max(0, Number(parsed.currentIndex) || 0),
    Math.max(0, total - 1),
  )

  const solvedIds = Array.isArray(parsed.solvedIds)
    ? [
        ...new Set(
          parsed.solvedIds
            .filter((id): id is number => Number.isInteger(id) && id > 0)
            .slice(0, total),
        ),
      ]
    : []

  return { currentIndex, solvedIds }
}

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota / private mode — progress stays in memory only.
  }
}

export function loadProgress(
  categorySlug: string,
  total: number,
): ProgressState {
  if (!isSafeSlug(categorySlug)) {
    return { currentIndex: 0, solvedIds: [] }
  }
  return sanitizeProgress(readJson(keyFor(categorySlug)), total)
}

export function saveProgress(categorySlug: string, state: ProgressState) {
  if (!isSafeSlug(categorySlug)) return
  writeJson(keyFor(categorySlug), {
    currentIndex: state.currentIndex,
    solvedIds: state.solvedIds,
  })
}

export function peekSolvedCount(categorySlug: string): number {
  if (!isSafeSlug(categorySlug)) return 0
  const parsed = readJson(keyFor(categorySlug)) as ProgressState | null
  if (!parsed || !Array.isArray(parsed.solvedIds)) return 0
  return parsed.solvedIds.length
}

export function loadAutoSkip(): boolean {
  try {
    return localStorage.getItem(AUTO_SKIP_KEY) === '1'
  } catch {
    return false
  }
}

export function saveAutoSkip(enabled: boolean) {
  try {
    localStorage.setItem(AUTO_SKIP_KEY, enabled ? '1' : '0')
  } catch {
    // ignore
  }
}
