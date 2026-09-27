import type { Deck } from '@repeat/types/deck'

const modules = import.meta.glob('./decks/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Deck>

export function getAllDecks(): Deck[] {
  return Object.values(modules).sort((a, b) => a.name.localeCompare(b.name))
}

export function getDeckBySlug(slug: string): Deck | undefined {
  return getAllDecks().find((deck) => deck.slug === slug)
}
