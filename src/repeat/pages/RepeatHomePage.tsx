import { DeckCatalog } from '@repeat/components/DeckCatalog'
import { getAllDecks } from '@repeat/decks'

export function RepeatHomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <DeckCatalog decks={getAllDecks()} />
    </div>
  )
}
