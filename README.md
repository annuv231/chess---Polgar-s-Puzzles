# Polgár Chess Puzzles

Practice László Polgár’s **4,462 mate-in-1 / mate-in-2 / mate-in-3** chess puzzles in a Chess.com-style trainer.

No account. Progress is stored in your browser (`localStorage`) only.

## Features

- Mate in One (307), Mate in Two (3,412), Mate in Three (743)
- Remix: all puzzles in random order
- Click or drag to move, with legal chess rules
- Auto-next after a correct solve
- Progress saved locally per category

Puzzle data is the public mate-problem set from [4462-chess-problems](https://github.com/denialromeo/4462-chess-problems) (Polgár examples 1–4462). The remaining book chapters (miniatures, endgames, tournament combinations) are not included.

## Run locally

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## License

App code is MIT. Puzzle positions originate from László Polgár’s *Chess: 5334 Problems, Combinations and Games*.
