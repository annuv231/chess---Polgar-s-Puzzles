import { useSyncExternalStore } from "react";
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";
import type { Deck } from "@repeat/types/deck";
import { allSteps } from "@repeat/types/deck";
import {
  deserializeCard,
  serializeCard,
  type SerializedCard,
} from "@repeat/lib/srs/card-serialize";
import type { AppSettings } from "@repeat/lib/srs/settings";
import { loadSettings } from "@repeat/lib/srs/settings";

export type StepProgress = {
  stepId: string;
  fsrs: SerializedCard;
  lastReviewedAt?: string;
};

export type ProgressStore = {
  version: 1;
  byStepId: Record<string, StepProgress>;
  deckEnrollment: Record<string, { startedAt: string }>;
  newIntroducedToday?: { date: string; count: number };
  completedLines?: Record<string, string>;
};

const PROGRESS_KEY = "chessreps:progress:v1";

const f = fsrs();

function emptyStore(): ProgressStore {
  return { version: 1, byStepId: {}, deckEnrollment: {} };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** True only after hydration, so localStorage reads do not mismatch the server HTML. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function loadProgress(): ProgressStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as ProgressStore;
    if (parsed.version !== 1) return emptyStore();
    return {
      version: 1,
      byStepId: parsed.byStepId ?? {},
      deckEnrollment: parsed.deckEnrollment ?? {},
      newIntroducedToday: parsed.newIntroducedToday,
      completedLines: parsed.completedLines ?? {},
    };
  } catch {
    return emptyStore();
  }
}

export function saveProgress(store: ProgressStore): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
}

export function enrollDeck(store: ProgressStore, deck: Deck): ProgressStore {
  const now = new Date();
  const byStepId = { ...store.byStepId };
  for (const step of allSteps(deck)) {
    if (!byStepId[step.id]) {
      byStepId[step.id] = {
        stepId: step.id,
        fsrs: serializeCard(createEmptyCard(now)),
      };
    }
  }
  const already = store.deckEnrollment[deck.id];
  return {
    ...store,
    byStepId,
    deckEnrollment: {
      ...store.deckEnrollment,
      [deck.id]: already ?? { startedAt: now.toISOString() },
    },
  };
}

export function getCard(store: ProgressStore, stepId: string): Card | null {
  const entry = store.byStepId[stepId];
  if (!entry) return null;
  return deserializeCard(entry.fsrs);
}

export function isStepDue(card: Card, now = new Date()): boolean {
  return card.due.getTime() <= now.getTime();
}

export function isNewCard(card: Card): boolean {
  return card.reps === 0 && card.lapses === 0 && card.state === 0;
}

export type DeckStats = {
  total: number;
  new: number;
  due: number;
  learned: number;
};

export function deckStats(deck: Deck, store: ProgressStore): DeckStats {
  const steps = allSteps(deck);
  const now = new Date();
  let newCount = 0;
  let due = 0;
  let learned = 0;

  for (const step of steps) {
    const card = getCard(store, step.id);
    if (!card || isNewCard(card)) {
      newCount++;
      continue;
    }
    if (isStepDue(card, now)) due++;
    else learned++;
  }

  return {
    total: steps.length,
    new: newCount,
    due,
    learned,
  };
}

export type QueuedStep = {
  stepId: string;
  lineId: string;
  lineName: string;
};

function interleaveByLine(items: QueuedStep[]): QueuedStep[] {
  const buckets: QueuedStep[][] = [];
  const indexByLine = new Map<string, number>();
  for (const item of items) {
    let index = indexByLine.get(item.lineId);
    if (index === undefined) {
      index = buckets.length;
      indexByLine.set(item.lineId, index);
      buckets.push([]);
    }
    buckets[index].push(item);
  }
  const mixed: QueuedStep[] = [];
  let pending = true;
  while (pending) {
    pending = false;
    for (const bucket of buckets) {
      const next = bucket.shift();
      if (!next) continue;
      mixed.push(next);
      pending = true;
    }
  }
  return mixed;
}

export function buildStudyQueue(
  deck: Deck,
  store: ProgressStore,
  settings: AppSettings = loadSettings(),
  lineId?: string,
): QueuedStep[] {
  const lines = lineId
    ? deck.lines.filter((line) => line.id === lineId)
    : deck.lines;
  const scoped = lines.length > 0 ? lines : deck.lines;

  // A chosen line is a drill: play every move in order, even if it is not due yet.
  if (lineId && lines.length > 0) {
    return lines.flatMap((line) =>
      line.steps.map((step) => ({
        stepId: step.id,
        lineId: line.id,
        lineName: line.name,
      })),
    );
  }

  const now = new Date();
  const due: QueuedStep[] = [];
  const fresh: QueuedStep[] = [];

  for (const line of scoped) {
    for (const step of line.steps) {
      const card = getCard(store, step.id);
      if (!card) continue;
      const item: QueuedStep = {
        stepId: step.id,
        lineId: line.id,
        lineName: line.name,
      };
      if (isNewCard(card)) fresh.push(item);
      else if (isStepDue(card, now)) due.push(item);
    }
  }

  due.sort((a, b) => {
    const ca = getCard(store, a.stepId)!;
    const cb = getCard(store, b.stepId)!;
    return ca.due.getTime() - cb.due.getTime();
  });

  const newSlice = interleaveByLine(fresh).slice(0, settings.dailyNewLimit);
  return [...due, ...newSlice];
}

export function gradeStep(
  store: ProgressStore,
  stepId: string,
  rating: Grade,
): ProgressStore {
  const entry = store.byStepId[stepId];
  if (!entry) return store;
  const card = deserializeCard(entry.fsrs);
  const wasNew = isNewCard(card);
  const now = new Date();
  const preview = f.repeat(card, now);
  const { card: next } = preview[rating];

  let newIntroducedToday = store.newIntroducedToday;
  if (wasNew) {
    const day = todayKey();
    if (newIntroducedToday?.date === day) {
      newIntroducedToday = { date: day, count: newIntroducedToday.count + 1 };
    } else {
      newIntroducedToday = { date: day, count: 1 };
    }
  }

  return {
    ...store,
    newIntroducedToday,
    byStepId: {
      ...store.byStepId,
      [stepId]: {
        stepId,
        fsrs: serializeCard(next),
        lastReviewedAt: now.toISOString(),
      },
    },
  };
}

export function lineProgressKey(deckId: string, lineId: string): string {
  return `${deckId}:${lineId}`;
}

export function markLineComplete(
  store: ProgressStore,
  deckId: string,
  lineId: string,
): ProgressStore {
  const key = lineProgressKey(deckId, lineId);
  if (store.completedLines?.[key]) return store;
  return {
    ...store,
    completedLines: {
      ...store.completedLines,
      [key]: new Date().toISOString(),
    },
  };
}

export function isLineComplete(
  store: ProgressStore,
  deckId: string,
  lineId: string,
): boolean {
  return Boolean(store.completedLines?.[lineProgressKey(deckId, lineId)]);
}

export function completedLineCount(deck: Deck, store: ProgressStore): number {
  return deck.lines.filter((line) => isLineComplete(store, deck.id, line.id))
    .length;
}

export function resetDeckProgress(
  store: ProgressStore,
  deck: Deck,
): ProgressStore {
  const byStepId = { ...store.byStepId };
  for (const step of allSteps(deck)) {
    delete byStepId[step.id];
  }
  const deckEnrollment = { ...store.deckEnrollment };
  delete deckEnrollment[deck.id];
  const completedLines = { ...store.completedLines };
  for (const line of deck.lines) {
    delete completedLines[lineProgressKey(deck.id, line.id)];
  }
  return { ...store, byStepId, deckEnrollment, completedLines };
}

export { Rating };
