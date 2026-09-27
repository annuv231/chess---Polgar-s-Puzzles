export type DeckColor = "w" | "b";

export type Step = {
  id: string;
  fenBefore: string;
  movesUci: string[];
  opponentReplies: string[];
  /** Algebraic notation of the move you should play. */
  san: string;
  /** Why this move, shown in practice mode. */
  comment?: string;
};

export type Line = {
  id: string;
  name: string;
  steps: Step[];
};

export type Deck = {
  id: string;
  slug: string;
  name: string;
  color: DeckColor;
  tags: string[];
  lines: Line[];
};

export type DeckManifestEntry = {
  id: string;
  slug: string;
  name: string;
  color: DeckColor;
  tags: string[];
  pgnFile: string;
};

export type DeckManifest = {
  decks: DeckManifestEntry[];
};

export function allSteps(deck: Deck): Step[] {
  return deck.lines.flatMap((line) => line.steps);
}

export function stepCount(deck: Deck): number {
  return allSteps(deck).length;
}
