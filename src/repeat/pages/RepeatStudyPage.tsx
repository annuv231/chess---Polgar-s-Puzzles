import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { StudySession, type StudyMode } from '@repeat/components/StudySession'
import { getDeckBySlug } from '@repeat/decks'

export function RepeatStudyPage() {
  const { slug = '' } = useParams()
  const [params] = useSearchParams()
  const deck = getDeckBySlug(slug)
  if (!deck) return <Navigate to="/repeat" replace />

  const mode: StudyMode = params.get('mode') === 'practice' ? 'practice' : 'train'
  const line = params.get('line') ?? undefined
  const lineId = deck.lines.some((entry) => entry.id === line) ? line : undefined

  return (
    <StudySession
      key={`${mode}-${lineId ?? 'all'}`}
      deck={deck}
      mode={mode}
      lineId={lineId}
    />
  )
}
