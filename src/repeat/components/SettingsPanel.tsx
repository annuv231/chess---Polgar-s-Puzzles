import { useState } from "react";
import type { Deck } from "@repeat/types/deck";
import {
  loadProgress,
  resetDeckProgress,
  saveProgress,
} from "@repeat/lib/srs/progress";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type AppSettings,
} from "@repeat/lib/srs/settings";
import { useIsClient } from "@repeat/lib/srs/progress";

type SettingsPanelProps = {
  decks: Deck[];
};

export function SettingsPanel({ decks }: SettingsPanelProps) {
  const isClient = useIsClient();
  const [override, setOverride] = useState<AppSettings | null>(null);
  const settings = override ?? (isClient ? loadSettings() : DEFAULT_SETTINGS);
  const [message, setMessage] = useState("");

  const save = (next: AppSettings) => {
    setOverride(next);
    saveSettings(next);
    setMessage("Settings saved.");
  };

  const resetDeck = (deck: Deck) => {
    if (
      !confirm(
        `Reset all progress for "${deck.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    let store = loadProgress();
    store = resetDeckProgress(store, deck);
    saveProgress(store);
    setMessage(`Reset progress for ${deck.name}.`);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="text-lg font-semibold">Study limits</h2>
        <p className="mt-1 text-sm text-stone-500">
          Maximum new moves introduced per day (in addition to reviews).
        </p>
        <label className="mt-4 flex items-center gap-3">
          <span className="text-sm font-medium">Daily new cards</span>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.dailyNewLimit}
            onChange={(e) =>
              save({
                ...settings,
                dailyNewLimit: Number(e.target.value) || 20,
              })
            }
            className="w-20 rounded-lg border border-stone-200 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950"
          />
        </label>
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
        <h2 className="text-lg font-semibold">Reset progress</h2>
        <p className="mt-1 text-sm text-stone-500">
          Remove spaced repetition data for a deck. Deck content is unchanged.
        </p>
        <ul className="mt-4 space-y-2">
          {decks.map((deck) => (
            <li
              key={deck.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-stone-100 px-4 py-3 dark:border-stone-800"
            >
              <span className="text-sm font-medium">{deck.name}</span>
              <button
                type="button"
                onClick={() => resetDeck(deck)}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Reset
              </button>
            </li>
          ))}
        </ul>
      </section>

      {message && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
      )}
    </div>
  );
}
