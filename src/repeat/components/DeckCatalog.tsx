import { useState } from "react";
import type { Deck } from "@repeat/types/deck";
import { DeckCard } from "@repeat/components/DeckCard";
import {
  completedLineCount,
  deckStats,
  enrollDeck,
  loadProgress,
  saveProgress,
  useIsClient,
  type ProgressStore,
} from "@repeat/lib/srs/progress";

type DeckCatalogProps = {
  decks: Deck[];
};

type Filter = "all" | "opening" | "gambit";

function readCatalogProgress(decks: Deck[]): ProgressStore {
  let next = loadProgress();
  let changed = false;
  for (const deck of decks) {
    if (!next.deckEnrollment[deck.id]) continue;
    const before = Object.keys(next.byStepId).length;
    next = enrollDeck(next, deck);
    if (Object.keys(next.byStepId).length !== before) changed = true;
  }
  if (changed) saveProgress(next);
  return next;
}

function emptyProgress(): ProgressStore {
  return { version: 1, byStepId: {}, deckEnrollment: {} };
}

export function DeckCatalog({ decks }: DeckCatalogProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const isClient = useIsClient();
  const store = isClient ? readCatalogProgress(decks) : emptyProgress();

  const filtered = decks.filter((deck) => {
    if (filter === "all") return true;
    return deck.tags.includes(filter);
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["opening", "Openings"],
            ["gambit", "Gambits"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === id
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((deck) => (
          <DeckCard
            key={deck.id}
            deck={deck}
            stats={deckStats(deck, store)}
            completedLines={completedLineCount(deck, store)}
          />
        ))}
      </div>
    </div>
  );
}
