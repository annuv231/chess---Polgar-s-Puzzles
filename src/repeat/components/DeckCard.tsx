import { Link } from "react-router-dom";
import type { Deck } from "@repeat/types/deck";
import type { DeckStats } from "@repeat/lib/srs/progress";

type DeckCardProps = {
  deck: Deck;
  stats: DeckStats;
  completedLines: number;
};

export function DeckCard({ deck, stats, completedLines }: DeckCardProps) {
  const side = deck.color === "w" ? "White" : "Black";
  const allLinesDone =
    deck.lines.length > 0 && completedLines === deck.lines.length;
  const dueLabel = allLinesDone
    ? "Complete"
    : completedLines > 0
      ? `${completedLines} ${completedLines === 1 ? "line" : "lines"} complete`
      : stats.due > 0
        ? `${stats.due} due`
        : stats.new > 0
          ? `${stats.new} new`
          : "Caught up";

  return (
    <Link
      to={`/repeat/decks/${deck.slug}`}
      className="flex flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-stone-800 dark:bg-stone-900 dark:hover:border-amber-700"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {deck.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium capitalize text-stone-600 dark:bg-stone-800 dark:text-stone-300"
          >
            {tag}
          </span>
        ))}
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {side}
        </span>
      </div>
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
        {deck.name}
      </h2>
      <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
        {stats.total} moves
        {" · "}
        <span className={completedLines > 0 ? "font-medium text-green-600" : ""}>
          {dueLabel}
        </span>
      </p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
        <div
          className={`h-full rounded-full transition-all ${allLinesDone ? "bg-green-600" : "bg-amber-500"}`}
          style={{
            width: `${stats.total ? Math.round((stats.learned / stats.total) * 100) : 0}%`,
          }}
        />
      </div>
    </Link>
  );
}
