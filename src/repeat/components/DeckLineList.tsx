import { Link } from "react-router-dom";
import type { Deck } from "@repeat/types/deck";
import { isLineComplete, loadProgress, useIsClient } from "@repeat/lib/srs/progress";

export function DeckLineList({ deck }: { deck: Deck }) {
  const isClient = useIsClient();
  const store = isClient
    ? loadProgress()
    : { version: 1 as const, byStepId: {}, deckEnrollment: {} };

  return (
    <ul className="mt-8 space-y-4">
      {deck.lines.map((line) => {
        const complete = isLineComplete(store, deck.id, line.id);
        return (
          <li
            key={line.id}
            className="rounded-xl border border-stone-200 p-4 dark:border-stone-800"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex flex-wrap items-center gap-2 font-medium">
                  {line.name}
                  {complete && (
                    <span className="text-sm font-semibold text-green-600">
                      Complete
                    </span>
                  )}
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  {line.steps.length}{" "}
                  {line.steps.length === 1 ? "training move" : "training moves"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/repeat/study/${deck.slug}?mode=practice&line=${line.id}`}
                  className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950"
                >
                  Practice
                </Link>
                <Link
                  to={`/repeat/study/${deck.slug}?mode=train&line=${line.id}`}
                  className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-amber-500 dark:text-stone-900"
                >
                  Train
                </Link>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
