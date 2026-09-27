import { Chessboard } from "react-chessboard";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Deck, Step } from "@repeat/types/deck";
import { isCorrectMove, playUciSequence } from "@repeat/lib/chess/uci";
import { Chess } from "chess.js";
import { Link } from "react-router-dom";
import {
  Rating,
  buildStudyQueue,
  enrollDeck,
  gradeStep,
  loadProgress,
  markLineComplete,
  saveProgress,
  useIsClient,
  type ProgressStore,
  type QueuedStep,
} from "@repeat/lib/srs/progress";
import { loadSettings } from "@repeat/lib/srs/settings";

export type StudyMode = "practice" | "train";

type Phase = "input" | "autoplay" | "wrong" | "done";

function findStep(deck: Deck, stepId: string): Step | undefined {
  for (const line of deck.lines) {
    const step = line.steps.find((s) => s.id === stepId);
    if (step) return step;
  }
}

function findLineName(deck: Deck, stepId: string): string {
  for (const line of deck.lines) {
    if (line.steps.some((s) => s.id === stepId)) return line.name;
  }
  return "";
}

function stepNumber(stepId: string): number {
  const raw = Number(stepId.split(":").at(-1));
  return Number.isFinite(raw) ? raw + 1 : 1;
}

function describeMove(san: string): string {
  if (san === "O-O") return "Castle kingside.";
  if (san === "O-O-O") return "Castle queenside.";
  const names: Record<string, string> = {
    N: "knight",
    B: "bishop",
    R: "rook",
    Q: "queen",
    K: "king",
  };
  const cleaned = san.replace(/[+#]/g, "");
  const [body, promo] = cleaned.split("=");
  const dest = body.slice(-2);
  const piece = names[body[0]] ?? "pawn";
  const verb = body.includes("x") ? `takes on ${dest}` : `to ${dest}`;
  const promotion = promo ? `, promoting to a ${names[promo] ?? promo}` : "";
  return `Play ${piece} ${verb}${promotion}.`;
}

type StudySessionProps = {
  deck: Deck;
  mode: StudyMode;
  lineId?: string;
};

export function StudySession({ deck, mode, lineId }: StudySessionProps) {
  const isClient = useIsClient();
  if (!isClient) {
    return <div className="fixed inset-0 z-30 bg-black" />;
  }
  return <StudySessionLive deck={deck} mode={mode} lineId={lineId} />;
}

function StudySessionLive({ deck, mode: initialMode, lineId }: StudySessionProps) {
  const [mode, setMode] = useState<StudyMode>(initialMode);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const [store, setStore] = useState(() => {
    const enrolled = enrollDeck(loadProgress(), deck);
    saveProgress(enrolled);
    return enrolled;
  });

  const [queue, setQueue] = useState<QueuedStep[]>(() =>
    buildStudyQueue(deck, store, loadSettings(), lineId),
  );
  const queueRef = useRef(queue);

  const current = queue[0];
  const step = current ? findStep(deck, current.stepId) : undefined;

  const [fen, setFen] = useState(step?.fenBefore ?? "");
  const fenRef = useRef(fen);
  const [phase, setPhase] = useState<Phase>(step ? "input" : "done");
  const [wrongSquare, setWrongSquare] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [completed, setCompleted] = useState<QueuedStep[]>([]);
  const [sessionTotal, setSessionTotal] = useState(() =>
    Math.max(queue.length, 1),
  );

  const setPosition = (nextFen: string) => {
    fenRef.current = nextFen;
    setFen(nextFen);
  };

  const boardOrientation: "white" | "black" =
    deck.color === "w" ? "white" : "black";

  const showStep = useCallback((nextQueue: QueuedStep[]) => {
    queueRef.current = nextQueue;
    setQueue(nextQueue);
    setWrongSquare(null);
    setHint(false);
    const next = nextQueue[0];
    const nextStep = next ? findStep(deck, next.stepId) : undefined;
    if (!next || !nextStep) {
      if (lineId) {
        setStore((currentStore) => {
          const marked = markLineComplete(currentStore, deck.id, lineId);
          if (marked !== currentStore) saveProgress(marked);
          return marked;
        });
      }
      setPhase("done");
      return;
    }
    fenRef.current = nextStep.fenBefore;
    setFen(nextStep.fenBefore);
    setPhase("input");
  }, [deck, lineId]);

  const advanceQueue = useCallback(
    (nextStore: ProgressStore, requeueCurrent: boolean) => {
      clearTimers();
      setStore(nextStore);
      saveProgress(nextStore);
      const prev = queueRef.current;
      const [head, ...rest] = prev;
      if (head && !requeueCurrent) {
        setCompleted((items) => [...items, head]);
      }
      const nextQueue = !head ? [] : requeueCurrent ? [...rest, head] : rest;
      showStep(nextQueue);
    },
    [showStep],
  );

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  const onPieceDrop = useCallback(
    ({
      sourceSquare,
      targetSquare,
    }: {
      sourceSquare: string;
      targetSquare: string | null;
    }) => {
      if (phase !== "input" || !step || !targetSquare) return false;

      const promo =
        targetSquare[1] === "8" || targetSquare[1] === "1" ? "q" : undefined;
      const result = isCorrectMove(
        fen,
        sourceSquare,
        targetSquare,
        promo,
        step.movesUci,
      );

      if (!result.ok) {
        const chess = new Chess(fen);
        let landed: string | null = null;
        try {
          const played = chess.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: promo,
          });
          if (played) landed = chess.fen();
        } catch {
          landed = null;
        }
        setWrongSquare(targetSquare);
        setPhase("wrong");
        if (landed) {
          setPosition(landed);
          return true;
        }
        return false;
      }

      const nextStore = gradeStep(store, step.id, Rating.Good);
      setStore(nextStore);
      saveProgress(nextStore);
      setPosition(playUciSequence(fen, [result.uci]));
      setPhase("autoplay");

      const replies = step.opponentReplies;
      if (replies.length === 0) {
        later(() => advanceQueue(nextStore, false), 450);
        return true;
      }

      let delay = 0;
      replies.forEach((uci, idx) => {
        delay += 420;
        later(() => {
          setPosition(playUciSequence(fenRef.current, [uci]));
          if (idx === replies.length - 1) {
            later(() => advanceQueue(nextStore, false), 380);
          }
        }, delay);
      });
      return true;
    },
    [advanceQueue, fen, phase, step, store],
  );

  const onTryAgain = () => {
    if (!step) return;
    setWrongSquare(null);
    setPosition(step.fenBefore);
    setPhase("input");
  };

  const playAgain = () => {
    const nextQueue = buildStudyQueue(deck, store, loadSettings(), lineId);
    setCompleted([]);
    setSessionTotal(Math.max(nextQueue.length, 1));
    showStep(nextQueue);
  };

  const goBack = () => {
    const previous = completed.at(-1);
    if (!previous || phase === "autoplay") return;
    setCompleted(completed.slice(0, -1));
    showStep([previous, ...queueRef.current]);
  };

  const goForward = () => {
    if (phase === "autoplay") return;
    const [head, ...rest] = queueRef.current;
    if (!head) return;
    setCompleted((items) => [...items, head]);
    showStep(rest);
  };

  const chessboardOptions = useMemo(
    () => ({
      position: fen,
      boardOrientation,
      allowDragging: phase === "input",
      onPieceDrop,
      showNotation: true,
      lightSquareStyle: { backgroundColor: "#f0d9b5" },
      darkSquareStyle: { backgroundColor: "#b58863" },
      squareRenderer: ({
        square,
        children,
      }: {
        square: string;
        children?: React.ReactNode;
      }) => (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {children}
          {square === wrongSquare && (
            <div
              style={{
                position: "absolute",
                top: "8%",
                right: "8%",
                width: "34%",
                aspectRatio: "1",
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden>
                <rect width="24" height="24" rx="5" fill="#d32f2f" />
                <path
                  d="M7 7 L17 17 M17 7 L7 17"
                  stroke="white"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>
      ),
    }),
    [boardOrientation, fen, onPieceDrop, phase, wrongSquare],
  );

  const progress = Math.min(
    1,
    completed.length / sessionTotal,
  );
  const showLesson = mode === "practice" || hint;

  if (phase === "done" || !step || !current) {
    const moreLeft =
      buildStudyQueue(deck, store, loadSettings(), lineId).length > 0;
    return (
      <StudyFrame progress={1} deckSlug={deck.slug}>
        <div className="flex h-full flex-1 items-center justify-center">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-semibold">
              {lineId ? "Line complete" : "Session complete"}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {lineId
                ? "You finished this line."
                : moreLeft
                  ? "This batch is done. The next moves are ready."
                  : "Nothing is due right now. Open a line to drill it anyway."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {(lineId || moreLeft) && (
                <button
                  type="button"
                  onClick={playAgain}
                  className="rounded-full bg-violet-600 px-5 py-2 text-sm font-medium text-white"
                >
                  {lineId ? "Play line again" : "Next moves"}
                </button>
              )}
              <Link
                to={`/repeat/decks/${deck.slug}`}
                className="rounded-full border border-zinc-600 px-5 py-2 text-sm"
              >
                Back to deck
              </Link>
            </div>
          </div>
        </div>
      </StudyFrame>
    );
  }

  const lineName = findLineName(deck, current.stepId);

  return (
    <StudyFrame progress={progress} deckSlug={deck.slug}>
      <div className="aspect-square w-[min(72vh,calc(100vw-400px))] min-w-[220px] max-w-[680px] shrink">
        <Chessboard options={chessboardOptions} />
      </div>
      <aside className="flex w-[320px] shrink-0 flex-col self-stretch rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2 py-1 font-medium text-zinc-200">
            <BookIcon />
            {mode === "practice" ? "Learn" : "Train"}
          </span>
          <span className="truncate text-zinc-300">{lineName}</span>
          <span className="ml-auto text-zinc-500">#{stepNumber(step.id)}</span>
        </div>

        <div className="mt-4 flex-1">
          {showLesson ? (
            <div className="rounded-xl bg-white p-4 text-zinc-900 shadow-sm">
              <div className="flex gap-3">
                <span className="mt-0.5 text-lg" aria-hidden>
                  ♟
                </span>
                <div>
                  {step.comment && (
                    <p className="text-sm leading-6">{step.comment}</p>
                  )}
                  <p className="mt-2 text-sm font-semibold">
                    {describeMove(step.san)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Find the move.</p>
          )}

          {phase === "autoplay" && (
            <p className="mt-4 text-sm text-zinc-500">Opponent is replying…</p>
          )}

          {phase === "wrong" && (
            <button
              type="button"
              onClick={onTryAgain}
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900"
            >
              Try again
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3 text-zinc-400">
          <button
            type="button"
            onClick={() =>
              setMode((currentMode) =>
                currentMode === "practice" ? "train" : "practice",
              )
            }
            className="rounded-lg p-2 hover:bg-zinc-900 hover:text-white"
            aria-label={mode === "practice" ? "Switch to train" : "Switch to learn"}
            title={mode === "practice" ? "Train" : "Learn"}
          >
            <ModeIcon />
          </button>
          <button
            type="button"
            onClick={() => setHint((value) => !value)}
            className={`rounded-lg p-2 hover:bg-zinc-900 hover:text-white ${hint ? "text-amber-300" : ""}`}
            aria-label="Hint"
            title="Hint"
          >
            <HintIcon />
          </button>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={goBack}
              disabled={completed.length === 0 || phase === "autoplay"}
              className="rounded-lg p-2 hover:bg-zinc-900 hover:text-white disabled:opacity-30"
              aria-label="Previous move"
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              onClick={goForward}
              disabled={phase === "autoplay"}
              className="rounded-lg p-2 hover:bg-zinc-900 hover:text-white disabled:opacity-30"
              aria-label="Next move"
            >
              <Chevron direction="right" />
            </button>
          </div>
        </div>
      </aside>
    </StudyFrame>
  );
}

function StudyFrame({
  progress,
  deckSlug,
  children,
}: {
  progress: number;
  deckSlug: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-black text-zinc-100">
      <header className="flex items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/repeat" className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="text-lg" aria-hidden>
            ♟
          </span>
          chessrepeats
        </Link>
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-[#7c4dff] transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <Link
          to={`/repeat/decks/${deckSlug}`}
          className="hidden rounded-full border border-zinc-600 px-4 py-1.5 text-sm sm:inline"
        >
          Decks
        </Link>
        <Link
          to="/repeat/settings"
          className="rounded-lg p-2 text-zinc-400 hover:text-white"
          aria-label="Settings"
        >
          <GearIcon />
        </Link>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-6 overflow-auto px-4 pb-4 sm:px-6">
        {children}
      </div>
    </div>
  );
}

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v13H7.5A2.5 2.5 0 0 0 5 22.5z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H18v5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function ModeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="8" width="18" height="10" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12h.01M12 12h.01M9 15h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function HintIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 18h6M10 21h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 3a6 6 0 0 0-3.2 11.1c.5.4.8 1 .8 1.6V17h5v-1.3c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={direction === "left" ? "M14 6 L8 12 L14 18" : "M10 6 L16 12 L10 18"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
