import { Chess, type Move, type Square } from "chess.js";

export function moveToUci(move: Move): string {
  const promo = move.promotion ?? "";
  return `${move.from}${move.to}${promo}`;
}

export function applyUci(chess: Chess, uci: string): Move | null {
  if (uci.length < 4) return null;
  const from = uci.slice(0, 2) as Square;
  const to = uci.slice(2, 4) as Square;
  const promotion = uci.length > 4 ? uci[4] : undefined;
  try {
    return chess.move({ from, to, promotion });
  } catch {
    return null;
  }
}

export function uciMatchesMove(uci: string, move: Move): boolean {
  return moveToUci(move) === uci.toLowerCase();
}

export function isCorrectMove(
  fen: string,
  sourceSquare: string,
  targetSquare: string,
  promotion: string | undefined,
  acceptableUci: string[],
): { ok: true; uci: string } | { ok: false } {
  const chess = new Chess(fen);
  let move: Move | null = null;
  try {
    move = chess.move({
      from: sourceSquare as Square,
      to: targetSquare as Square,
      promotion: promotion as Move["promotion"],
    });
  } catch {
    return { ok: false };
  }
  if (!move) return { ok: false };
  const uci = moveToUci(move);
  if (acceptableUci.some((a) => a.toLowerCase() === uci)) {
    return { ok: true, uci };
  }
  return { ok: false };
}

export function playUciSequence(fen: string, moves: string[]): string {
  const chess = new Chess(fen);
  for (const uci of moves) {
    const result = applyUci(chess, uci);
    if (!result) break;
  }
  return chess.fen();
}
