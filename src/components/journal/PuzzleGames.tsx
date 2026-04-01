import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, RotateCcw, Clock, Play, ChevronLeft } from "lucide-react";
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
      const selectedLetters = Array.from(next).map((k) => {
        const [sr, sc] = k.split(",").map(Number);
        return { r: sr, c: sc, letter: grid[sr][sc] };
      });
      for (const word of placedWords) {
        if (foundWords.has(word)) continue;
        const wordLetters = word.split("");
        const matching = selectedLetters.filter((s) => wordLetters.includes(s.letter));
        if (matching.length >= word.length) {
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
        <div className="text-sm text-muted-foreground">{foundWords.size}/{placedWords.length} words</div>
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(10, 1fr)` }}>
        {grid.map((row, r) =>
          row.map((letter, c) => {
            const key = `${r},${c}`;
            const isSelected = selected.has(key);
            return (
              <button key={key} onClick={() => toggleCell(r, c)}
                className="flex h-8 w-8 items-center justify-center rounded text-xs font-bold transition-colors sm:h-9 sm:w-9 sm:text-sm"
                style={isSelected ? { backgroundColor: "#6366F1", color: "white" } : { backgroundColor: "#F1F5F9", color: "#0F172A" }}
              >{letter}</button>
            );
          })
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {placedWords.map((word) => (
          <span key={word} className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium",
            foundWords.has(word) ? "line-through" : ""
          )} style={foundWords.has(word) ? { backgroundColor: "rgba(99,102,241,0.15)", color: "#6366F1" } : { backgroundColor: "#F1F5F9", color: "#6B7280" }}>
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

// ======== SUDOKU ========
const EASY_SUDOKU = [
  [5,3,0,0,7,0,0,0,0],[6,0,0,1,9,5,0,0,0],[0,9,8,0,0,0,0,6,0],
  [8,0,0,0,6,0,0,0,3],[4,0,0,8,0,3,0,0,1],[7,0,0,0,2,0,0,0,6],
  [0,6,0,0,0,0,2,8,0],[0,0,0,4,1,9,0,0,5],[0,0,0,0,8,0,0,7,9],
];
const SUDOKU_SOLUTION = [
  [5,3,4,6,7,8,9,1,2],[6,7,2,1,9,5,3,4,8],[1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],[4,2,6,8,5,3,7,9,1],[7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],[2,8,7,4,1,9,6,3,5],[3,4,5,2,8,6,1,7,9],
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
    if (EASY_SUDOKU[r][c] !== 0) return;
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = val;
    setBoard(newBoard);
    const isComplete = newBoard.every((row, ri) => row.every((v, ci) => v === SUDOKU_SOLUTION[ri][ci]));
    if (isComplete) onComplete(Math.floor((Date.now() - startTime) / 1000));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" /> {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
      </div>
      <div className="grid grid-cols-9 gap-0 rounded-xl overflow-hidden" style={{ border: "2px solid #CBD5E1" }}>
        {board.map((row, r) =>
          row.map((val, c) => {
            const isOriginal = EASY_SUDOKU[r][c] !== 0;
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const isWrong = val !== 0 && val !== SUDOKU_SOLUTION[r][c];
            return (
              <button key={`${r}-${c}`} onClick={() => setSelectedCell([r, c])}
                className={cn("flex h-8 w-8 items-center justify-center text-sm font-medium sm:h-9 sm:w-9",
                  c % 3 === 2 && c < 8 && "border-r-2", r % 3 === 2 && r < 8 && "border-b-2"
                )}
                style={{
                  backgroundColor: isSelected ? "rgba(99,102,241,0.15)" : "white",
                  color: isWrong ? "#DC2626" : isOriginal ? "#0F172A" : "#6366F1",
                  fontWeight: isOriginal ? 700 : 500,
                  borderColor: "#E2E8F0", border: "1px solid #E2E8F0",
                }}
              >{val || ""}</button>
            );
          })
        )}
      </div>
      <div className="flex gap-1.5">
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button key={n} onClick={() => handleInput(n)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-colors"
            style={{ backgroundColor: "#F1F5F9", color: "#0F172A" }}
          >{n}</button>
        ))}
      </div>
    </div>
  );
}

// ======== JIGSAW ========
function JigsawGame({ onComplete }: { onComplete: (time: number) => void }) {
  const gridSize = 3;
  const [pieces, setPieces] = useState<number[]>([]);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
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
      if (newPieces.every((p, i) => p === i)) {
        onComplete(Math.floor((Date.now() - startTime) / 1000));
      }
    }
  };

  const colors = ["#7C3AED", "#8B5CF6", "#A78BFA", "#6D28D9", "#5B21B6", "#DDD6FE", "#C4B5FD", "#EDE9FE", "#4C1D95"];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" /> {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
        </div>
        <p className="text-xs text-muted-foreground">Tap two pieces to swap</p>
      </div>
      <div className="grid grid-cols-3 gap-1.5 rounded-2xl p-2" style={{ border: "2px solid #E5E7EB" }}>
        {pieces.map((piece, index) => (
          <button key={index} onClick={() => handleClick(index)}
            className={cn("flex h-20 w-20 items-center justify-center rounded-xl text-lg font-bold text-white transition-all sm:h-24 sm:w-24",
              selected === index && "scale-105 ring-2 ring-offset-2"
            )}
            style={{ backgroundColor: colors[piece], ...(selected === index ? { ringColor: "#6366F1" } : {}) }}
          >{piece + 1}</button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Arrange numbers 1-9 in order</p>
    </div>
  );
}

// ======== MAIN - Stitch Creative Pause ========
type GameType = "word-search" | "sudoku" | "jigsaw";

interface PuzzleGamesProps {
  open: boolean;
  onClose: () => void;
  onComplete: (gameName: string, timeSeconds: number) => void;
}

const GAME_CARDS: { id: GameType; name: string; desc: string; emoji: string }[] = [
  { id: "word-search", name: "Word Search", desc: "Find hidden wellness words in the grid", emoji: "search" },
  { id: "jigsaw", name: "Jigsaw Puzzle", desc: "Swap pieces to solve the pattern", emoji: "puzzle" },
  { id: "sudoku", name: "Sudoku (Easy)", desc: "Fill the 9×9 grid with numbers 1-9", emoji: "hash" },
];

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
          className="fixed inset-0 z-[60] flex flex-col"
          style={{ backgroundColor: "#F9FAFB" }}
        >
          {/* Stitch Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #E5E7EB" }}>
            <div className="flex items-center gap-2">
              {game && (
                <button onClick={() => { setGame(null); setCompleted(null); }} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <h3 className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                {game ? (game === "word-search" ? "Word Search" : game === "sudoku" ? "Sudoku" : "Jigsaw Puzzle") : "Creative Pause"}
              </h3>
            </div>
            <button onClick={resetAndClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-lg px-4 py-6">
              {completed && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mb-6 flex flex-col items-center gap-2 rounded-2xl p-6"
                  style={{ backgroundColor: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <Trophy className="h-8 w-8" style={{ color: "#6366F1" }} />
                  <p className="text-lg font-semibold" style={{ color: "#0F172A" }}>Puzzle Complete!</p>
                  <p className="text-sm text-muted-foreground">
                    {completed.game} — {Math.floor(completed.time / 60)}:{(completed.time % 60).toString().padStart(2, "0")}
                  </p>
                </motion.div>
              )}

              {!game ? (
                <div className="space-y-3">
                  <p className="text-center mb-4 italic" style={{ color: "#6B7280", fontSize: 18 }}>
                    Take a creative pause...
                  </p>
                  {GAME_CARDS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGame(g.id)}
                      className="w-full flex items-center gap-4 rounded-2xl p-5 text-left transition-all hover:shadow-md"
                      style={{ backgroundColor: "white", border: "1px solid #E5E7EB" }}
                    >
                      <span className="text-3xl">{g.emoji}</span>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold" style={{ color: "#0F172A" }}>{g.name}</h4>
                        <p className="text-xs text-muted-foreground">{g.desc}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EEF2FF" }}>
                        <Play className="w-3.5 h-3.5" style={{ color: "#6366F1" }} />
                      </div>
                    </button>
                  ))}

                  <button
                    onClick={resetAndClose}
                    className="w-full mt-4 py-3 rounded-2xl text-sm font-bold text-white"
                    style={{ backgroundColor: "#6366F1" }}
                  >
                    Open Journal
                  </button>
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
