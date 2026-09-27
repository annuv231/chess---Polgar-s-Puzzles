import { Link } from "react-router-dom";
import { useState } from "react";
import type { Deck } from "@repeat/types/deck";
import type { ProgressStore } from "@repeat/lib/srs/progress";
import {
  deckStats,
  enrollDeck,
  loadProgress,
  saveProgress,
  useIsClient,
} from "@repeat/lib/srs/progress";

type DeckDetailActionsProps = {
  deck: Deck;
};

function syncedProgress(deck: Deck) {
  let store = loadProgress();
  if (!store.deckEnrollment[deck.id]) return store;
  const before = Object.keys(store.byStepId).length;
  store = enrollDeck(store, deck);
  if (Object.keys(store.byStepId).length !== before) saveProgress(store);
  return store;
}

const EMPTY_PROGRESS: ProgressStore = {
  version: 1,
  byStepId: {},
  deckEnrollment: {},
};

export function DeckDetailActions({ deck }: DeckDetailActionsProps) {
  const isClient = useIsClient();
  const [override, setOverride] = useState<ReturnType<typeof loadProgress> | null>(
    null,
  );
  const store =
    override ??
    (isClient ? syncedProgress(deck) : EMPTY_PROGRESS);
  const stats = deckStats(deck, store);

  const startDeck = () => {
    const s = enrollDeck(loadProgress(), deck);
    saveProgress(s);
    setOverride(s);
  };

  const enrolled = store.deckEnrollment[deck.id];
  const practiceHref = `/repeat/study/${deck.slug}?mode=practice`;
  const trainHref = `/repeat/study/${deck.slug}?mode=train`;
  const pct = stats.total
    ? Math.round((stats.learned / stats.total) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
      <div className="mb-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-semibold text-amber-600">{stats.due}</p>
          <p className="text-xs text-stone-500">Due</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{stats.new}</p>
          <p className="text-xs text-stone-500">New</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{pct}%</p>
          <p className="text-xs text-stone-500">Learned</p>
        </div>
      </div>

      {!enrolled && (
        <button
          type="button"
          onClick={startDeck}
          className="mb-3 w-full rounded-lg border border-stone-200 py-3 text-sm font-medium dark:border-stone-700"
        >
          Add to my decks
        </button>
      )}
      <Link
        to={practiceHref}
        className="mb-2 flex w-full items-center justify-center rounded-lg border border-amber-300 py-3 text-sm font-medium text-amber-900 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950"
      >
        Practice
      </Link>
      <Link
        to={trainHref}
        className="flex w-full items-center justify-center rounded-lg bg-stone-900 py-3 text-sm font-medium text-white dark:bg-amber-500 dark:text-stone-900"
      >
        Train
      </Link>
      <p className="mt-3 text-center text-xs leading-5 text-stone-500">
        Practice shows the move and the idea. Train hides both.
      </p>
    </div>
  );
}
