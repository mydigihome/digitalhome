import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ======== WORD SEARCH ========
const WORD_LISTS = [
  ["PEACE", "CALM", "HOPE", "JOY", "LOVE", "REST", "HEAL", "GROW"],
  ["BRAVE", "LIGHT", "DREAM", "SMILE", "TRUST", "KIND", "FREE", "SOUL"],
];

function generateWordSearch(words: string[]): { grid: string[][]; placedWords: string[] } {
  const size = 10;
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const placed: string[] = [];
  const dirs = [[0, 1], [1, 0], [1, 1], [0, -1], [1, -1]];

  for (const word of words) {
    let attempts = 0;
    while (attempts < 50) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      let fits = true;
      for (let i = 0; i < word.length; i++) {
        const nr = r + dir[0] * i;
        const nc = c + dir[1] * i;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) { fits = false; break; }
        if (grid[nr][nc] !== "" && grid[nr][nc] !== word[i]) { fits = false; break; }
      }
      if (fits) {
        for (let i = 0; i < word.length; i++) {
          grid[r + dir[0] * i][c + dir[1] * i] = word[i];
        }
        placed.push(word);
        break;
      }
      attempts++;
    }
  }

  // Fill empty cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === "") grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }
  }
  return { grid, placedWords: placed };
}

function WordSearchGame({ onComplete }: { onComplete: (time: number) => void }) {
  const [wordList] = useState(() => WORD_LISTS[Math.floor(Math.random() * WORD_LISTS.length)]);
  const [{ grid, placedWords }] = useState(() => generateWordSearch(wordList));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const toggleCell = (r: number, c: number) => {
    const key = `${r},${c}`;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);

      // Check if any word is fully selected
      const selectedLetters = Array.from(next).map((k) => {
        const [sr, sc] = k.split(",").map(Number);
        return { r: sr, c: sc, letter: grid[sr][sc] };
      });

      for (const word of placedWords) {
        if (foundWords.has(word)) continue;
        // Simple check: does the selected set contain this word's letters in sequence?
        const wordLetters = word.split("");
        const matching = selectedLetters.filter((s) => wordLetters.includes(s.letter));
        if (matching.length >= word.length) {
          // Verify it's actually the word by checking the string formed
          const sorted = [...matching].sort((a, b) => a.r - b.r || a.c - b.c);
          const str = sorted.map((s) => s.letter).join("");
          if (str.includes(word) || str.split("").reverse().join("").includes(word)) {
            setFoundWords((prev) => new Set([...prev, word]));
            if (foundWords.size + 1 === placedWords.length) {
              onComplete(Math.floor((Date.now() - startTime) / 1000));
            }
          }
        }
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
        </div>
        <div className="text-sm text-muted-foreground">
          {foundWords.size}/{placedWords.length} words
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(10, 1fr)` }}>
        {grid.map((row, r) =>
          row.map((letter, c) => {
            const key = `${r},${c}`;
            const isSelected = selected.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleCell(r, c)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded text-xs font-bold transition-colors sm:h-9 sm:w-9 sm:text-sm",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-accent"
                )}
              >
                {letter}
              </button>
            );
          })
        )}
      </div>

      {/* Words to find */}
      <div className="flex flex-wrap justify-center gap-2">
        {placedWords.map((word) => (
          <span
            key={word}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              foundWords.has(word)
                ? "bg-primary/20 text-primary line-through"
                : "bg-secondary text-muted-foreground"
            )}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

// ======== SUDOKU (Easy) ========
const EASY_SUDOKU = [
  [5,3,0,0,7,0,0,0,0],
  [6,0,0,1,9,5,0,0,0],
  [0,9,8,0,0,0,0,6,0],
  [8,0,0,0,6,0,0,0,3],
  [4,0,0,8,0,3,0,0,1],
  [7,0,0,0,2,0,0,0,6],
  [0,6,0,0,0,0,2,8,0],
  [0,0,0,4,1,9,0,0,5],
  [0,0,0,0,8,0,0,7,9],
];

const SUDOKU_SOLUTION = [
  [5,3,4,6,7,8,9,1,2],
  [6,7,2,1,9,5,3,4,8],
  [1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],
  [4,2,6,8,5,3,7,9,1],
  [7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],
  [2,8,7,4,1,9,6,3,5],
  [3,4,5,2,8,6,1,7,9],
];

function SudokuGame({ onComplete }: { onComplete: (time: number) => void }) {
  const [board, setBoard] = useState(() => EASY_SUDOKU.map((r) => [...r]));
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const handleInput = (val: number) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (EASY_SUDOKU[r][c] !== 0) return; // Can't edit pre-filled
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = val;
    setBoard(newBoard);

    // Check completion
    const isComplete = newBoard.every((row, ri) => row.every((v, ci) => v === SUDOKU_SOLUTION[ri][ci]));
    if (isComplete) onComplete(Math.floor((Date.now() - startTime) / 1000));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" /> {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-9 gap-0 border-2 border-foreground/40 rounded">
        {board.map((row, r) =>
          row.map((val, c) => {
            const isOriginal = EASY_SUDOKU[r][c] !== 0;
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const isWrong = val !== 0 && val !== SUDOKU_SOLUTION[r][c];
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => setSelectedCell([r, c])}
                className={cn(
                  "flex h-8 w-8 items-center justify-center text-sm font-medium transition-colors sm:h-9 sm:w-9",
                  isSelected ? "bg-primary/20" : "bg-card",
                  isOriginal ? "font-bold text-foreground" : "text-primary",
                  isWrong && "text-destructive",
                  c % 3 === 2 && c < 8 && "border-r-2 border-foreground/30",
                  r % 3 === 2 && r < 8 && "border-b-2 border-foreground/30",
                  "border border-border"
                )}
              >
                {val || ""}
              </button>
            );
          })
        )}
      </div>

      {/* Number pad */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleInput(n)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-sm font-bold text-foreground transition-colors hover:bg-accent"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ======== JIGSAW ========
function JigsawGame({ onComplete }: { onComplete: (time: number) => void }) {
  const gridSize = 3; // 3x3 = 9 pieces
  const [pieces, setPieces] = useState<number[]>([]);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    // Shuffle pieces (0..8)
    const arr = Array.from({ length: gridSize * gridSize }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setPieces(arr);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const handleClick = (index: number) => {
    if (selected === null) {
      setSelected(index);
    } else {
      const newPieces = [...pieces];
      [newPieces[selected], newPieces[index]] = [newPieces[index], newPieces[selected]];
      setPieces(newPieces);
      setSelected(null);

      // Check if solved
      if (newPieces.every((p, i) => p === i)) {
        onComplete(Math.floor((Date.now() - startTime) / 1000));
      }
    }
  };

  // Colors for the gradient pattern
  const colors = ["#7C3AED", "#8B5CF6", "#A78BFA", "#6D28D9", "#5B21B6", "#DDD6FE", "#C4B5FD", "#EDE9FE", "#4C1D95"];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
        </div>
        <p className="text-xs text-muted-foreground">Tap two pieces to swap</p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg border-2 border-border p-1">
        {pieces.map((piece, index) => {
          const correctRow = Math.floor(piece / gridSize);
          const correctCol = piece % gridSize;
          return (
            <button
              key={index}
              onClick={() => handleClick(index)}
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-md text-lg font-bold text-white transition-all sm:h-24 sm:w-24",
                selected === index && "ring-2 ring-primary ring-offset-2 scale-105"
              )}
              style={{ backgroundColor: colors[piece] }}
            >
              {piece + 1}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">Arrange numbers 1-9 in order (left to right, top to bottom)</p>
    </div>
  );
}

// ======== MAIN COMPONENT ========

type GameType = "word-search" | "sudoku" | "jigsaw";

interface PuzzleGamesProps {
  open: boolean;
  onClose: () => void;
  onComplete: (gameName: string, timeSeconds: number) => void;
}

export default function PuzzleGames({ open, onClose, onComplete }: PuzzleGamesProps) {
  const [game, setGame] = useState<GameType | null>(null);
  const [completed, setCompleted] = useState<{ game: string; time: number } | null>(null);

  const handleComplete = useCallback((time: number) => {
    const gameName = game === "word-search" ? "Word Search" : game === "sudoku" ? "Sudoku" : "Jigsaw Puzzle";
    setCompleted({ game: gameName, time });
    onComplete(gameName, time);
  }, [game, onComplete]);

  const resetAndClose = () => {
    setGame(null);
    setCompleted(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              {game ? (game === "word-search" ? "Word Search" : game === "sudoku" ? "Sudoku" : "Jigsaw Puzzle") : "Puzzle Games"}
            </h3>
            <div className="flex items-center gap-2">
              {game && (
                <Button size="sm" variant="outline" onClick={() => { setGame(null); setCompleted(null); }}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Back
                </Button>
              )}
              <button onClick={resetAndClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-lg px-4 py-6">
              {completed && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-6 flex flex-col items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-6"
                >
                  <Trophy className="h-8 w-8 text-primary" />
                  <p className="text-lg font-semibold text-foreground">Puzzle Complete!</p>
                  <p className="text-sm text-muted-foreground">
                    {completed.game} — {Math.floor(completed.time / 60)}:{(completed.time % 60).toString().padStart(2, "0")}
                  </p>
                </motion.div>
              )}

              {!game ? (
                <div className="grid gap-3">
                  {([
                    { id: "word-search" as GameType, name: "Word Search", desc: "Find hidden wellness words in the grid", emoji: "🔍" },
                    { id: "jigsaw" as GameType, name: "Jigsaw Puzzle", desc: "Swap pieces to solve the pattern", emoji: "🧩" },
                    { id: "sudoku" as GameType, name: "Sudoku (Easy)", desc: "Fill the 9×9 grid with numbers 1-9", emoji: "🔢" },
                  ]).map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGame(g.id)}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <span className="text-3xl">{g.emoji}</span>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{g.name}</h4>
                        <p className="text-xs text-muted-foreground">{g.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : game === "word-search" ? (
                <WordSearchGame onComplete={handleComplete} />
              ) : game === "sudoku" ? (
                <SudokuGame onComplete={handleComplete} />
              ) : (
                <JigsawGame onComplete={handleComplete} />
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
