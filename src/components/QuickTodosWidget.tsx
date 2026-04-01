import { useState, useRef } from "react";
import { useQuickTodos, useAddQuickTodo, useUpdateQuickTodo, useDeleteQuickTodo } from "@/hooks/useQuickTodos";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuickTodosWidget() {
  const { data: todos = [] } = useQuickTodos();
  const addTodo = useAddQuickTodo();
  const updateTodo = useUpdateQuickTodo();
  const deleteTodo = useDeleteQuickTodo();
  const [newText, setNewText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const visible = todos.filter(t => !t.completed).slice(0, 10);
  const completed = todos.filter(t => t.completed);

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    addTodo.mutate({ text, order: visible.length });
    setNewText("");
    inputRef.current?.focus();
  };

  const handleToggle = (todo: typeof todos[0]) => {
    updateTodo.mutate({ id: todo.id, completed: !todo.completed });
  };

  const handleTextChange = (id: string, text: string) => {
    updateTodo.mutate({ id, text });
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...visible];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    reordered.forEach((t, i) => {
      if (t.order !== i) updateTodo.mutate({ id: t.id, order: i });
    });
    setDragIdx(idx);
  };

  const placeholders = [
    "Don't forget pickleball league starts March 16th",
    "Call mom on Thursday",
    "Buy groceries for dinner party",
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Quick To-Dos</h3>
        <span className="text-xs text-muted-foreground">{visible.length}/10</span>
      </div>

      <div className="space-y-1 mb-3">
        {visible.map((todo, idx) => (
          <div
            key={todo.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={() => setDragIdx(null)}
            className={cn(
              "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-secondary/50",
              dragIdx === idx && "opacity-50"
            )}
          >
            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            <button
              onClick={() => handleToggle(todo)}
              className="flex h-[18px] w-[18px] items-center justify-center rounded border-2 border-border hover:border-primary transition-colors flex-shrink-0"
            >
              {todo.completed && <span className="text-[10px]"></span>}
            </button>
            <input
              type="text"
              value={todo.text}
              onChange={(e) => handleTextChange(todo.id, e.target.value)}
              className={cn(
                "flex-1 bg-transparent text-sm outline-none",
                todo.completed && "line-through text-muted-foreground"
              )}
            />
            <button
              onClick={() => deleteTodo.mutate(todo.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {visible.length === 0 && (
          <div className="py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Quick space for thoughts & reminders</p>
            <div className="space-y-1">
              {placeholders.map((p, i) => (
                <p key={i} className="text-[11px] text-muted-foreground/50 italic">"{p}"</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {visible.length < 10 && (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add a quick note..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim()}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      )}

      {completed.length > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">{completed.length} completed</p>
      )}
    </div>
  );
}
