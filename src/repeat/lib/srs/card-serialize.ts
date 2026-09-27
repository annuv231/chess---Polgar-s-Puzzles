import type { Card } from "ts-fsrs";
import { State } from "ts-fsrs";

export type SerializedCard = {
  due: string;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: string;
  elapsed_days: number;
};

export function serializeCard(card: Card): SerializedCard {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review?.toISOString(),
    elapsed_days: card.elapsed_days,
  };
}

export function deserializeCard(data: SerializedCard): Card {
  return {
    due: new Date(data.due),
    stability: data.stability,
    difficulty: data.difficulty,
    scheduled_days: data.scheduled_days,
    learning_steps: data.learning_steps,
    reps: data.reps,
    lapses: data.lapses,
    state: data.state,
    last_review: data.last_review ? new Date(data.last_review) : undefined,
    elapsed_days: data.elapsed_days,
  };
}
