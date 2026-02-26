import { SetupData, IdeaEntry, IdeasTable } from "./types";
import { Plus, X } from "lucide-react";
import AutoTextarea from "./AutoTextarea";
import { useState, useRef } from "react";

const PILLAR_COLORS = ["#FFF5F0", "#F0F7FF", "#FFF0F8", "#F0FFF4", "#FFF8E0", "#F0FFFF", "#FFF0FF"];

interface Props {
  setup: SetupData;
  ideasTables: IdeasTable[];
  setIdeasTables: (fn: IdeasTable[] | ((prev: IdeasTable[]) => IdeasTable[])) => void;
}

function EditableTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (editing) {
    return (
      <input
        autoFocus
        className="bg-transparent text-sm font-semibold text-gray-800 outline-none border-b border-gray-300 px-1 py-0.5"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={e => { if (e.key === "Enter") { onChange(draft); setEditing(false); } }}
      />
    );
  }
  return (
    <span
      className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-gray-600 transition-colors"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value || "Untitled"}
    </span>
  );
}

function EditableHeader({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (editing) {
    return (
      <input
        autoFocus
        className="bg-transparent text-xs font-semibold uppercase tracking-wider text-gray-700 outline-none w-full"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={e => { if (e.key === "Enter") { onChange(draft); setEditing(false); } }}
      />
    );
  }
  return (
    <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 cursor-pointer" onClick={() => { setDraft(value); setEditing(true); }}>
      {value}
    </span>
  );
}

function ColorDot({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        className="w-4 h-4 rounded-full border border-gray-200 shrink-0 cursor-pointer hover:scale-110 transition-transform"
        style={{ background: color }}
        onClick={() => inputRef.current?.click()}
        title="Change column color"
      />
      <input
        ref={inputRef}
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="sr-only"
      />
    </>
  );
}

function SingleTable({
  table,
  onUpdateTitle,
  onUpdateColumnColor,
  onUpdateColumnName,
  onUpdateIdea,
  onAddIdea,
  onRemoveIdea,
  onDelete,
  canDelete,
}: {
  table: IdeasTable;
  onUpdateTitle: (title: string) => void;
  onUpdateColumnColor: (pillar: string, color: string) => void;
  onUpdateColumnName: (oldName: string, newName: string) => void;
  onUpdateIdea: (pillar: string, idx: number, text: string) => void;
  onAddIdea: (pillar: string) => void;
  onRemoveIdea: (pillar: string, idx: number) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const pillars = table.pillars || [];
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      {/* Table title */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50/50 border-b border-gray-100">
        <EditableTitle value={table.title} onChange={onUpdateTitle} />
        {canDelete && (
          <button
            onClick={onDelete}
            className="text-gray-300 hover:text-red-400 transition-colors p-1"
            title="Remove table"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {/* Columns */}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${pillars.length}, minmax(0, 1fr))` }}>
        {pillars.map((pillar) => {
          const colColor = table.columnColors[pillar] || PILLAR_COLORS[pillars.indexOf(pillar) % PILLAR_COLORS.length];
          return (
            <div key={pillar} className="border-r border-gray-100 last:border-r-0 flex flex-col">
              <div
                className="px-3 py-2 border-b border-gray-100 flex items-center gap-2"
                style={{ background: colColor }}
              >
                <ColorDot color={colColor} onChange={(c) => onUpdateColumnColor(pillar, c)} />
                <EditableHeader
                  value={pillar}
                  onChange={(newName) => onUpdateColumnName(pillar, newName)}
                />
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {(table.ideas[pillar] || []).map((idea, idx) => (
                  <div key={idea.id} className="flex group">
                    <AutoTextarea
                      className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-gray-700"
                      value={idea.text}
                      onChange={e => onUpdateIdea(pillar, idx, e.target.value)}
                      placeholder="Type idea..."
                    />
                    <button
                      onClick={() => onRemoveIdea(pillar, idx)}
                      className="px-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => onAddIdea(pillar)}
                className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 border-t border-gray-100 transition-colors"
              >
                <Plus size={10} /> Add Idea
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function IdeasBankTab({ setup, ideasTables, setIdeasTables }: Props) {
  const pillars = setup.contentPillars.filter(p => p.trim());

  const updateTable = (tableId: string, patch: Partial<IdeasTable>) => {
    setIdeasTables(prev => prev.map(t => t.id === tableId ? { ...t, ...patch } : t));
  };

  const updateColumnColor = (tableId: string, pillar: string, color: string) => {
    setIdeasTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, columnColors: { ...t.columnColors, [pillar]: color } } : t
    ));
  };

  const updateColumnName = (tableId: string, oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    setIdeasTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const newPillars = (t.pillars || []).map(p => p === oldName ? newName : p);
      const newIdeas = { ...t.ideas };
      if (newIdeas[oldName]) {
        newIdeas[newName] = newIdeas[oldName];
        delete newIdeas[oldName];
      }
      const newColors = { ...t.columnColors };
      if (newColors[oldName]) {
        newColors[newName] = newColors[oldName];
        delete newColors[oldName];
      }
      return { ...t, pillars: newPillars, ideas: newIdeas, columnColors: newColors };
    }));
  };

  const updateIdea = (tableId: string, pillar: string, idx: number, text: string) => {
    setIdeasTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const arr = [...(t.ideas[pillar] || [])];
      if (idx < arr.length) arr[idx] = { ...arr[idx], text };
      return { ...t, ideas: { ...t.ideas, [pillar]: arr } };
    }));
  };

  const addIdea = (tableId: string, pillar: string) => {
    setIdeasTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      return { ...t, ideas: { ...t.ideas, [pillar]: [...(t.ideas[pillar] || []), { id: crypto.randomUUID(), text: "" }] } };
    }));
  };

  const removeIdea = (tableId: string, pillar: string, idx: number) => {
    setIdeasTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      return { ...t, ideas: { ...t.ideas, [pillar]: (t.ideas[pillar] || []).filter((_, i) => i !== idx) } };
    }));
  };

  const deleteTable = (tableId: string) => {
    setIdeasTables(prev => prev.filter(t => t.id !== tableId));
  };

  const addTable = () => {
    const columnColors: Record<string, string> = {};
    pillars.forEach((p, i) => { columnColors[p] = PILLAR_COLORS[i % PILLAR_COLORS.length]; });
    const newTable: IdeasTable = {
      id: crypto.randomUUID(),
      title: "New Platform",
      pillars: [...pillars],
      columnColors,
      ideas: {},
    };
    setIdeasTables(prev => [...prev, newTable]);
  };

  return (
    <div className="flex flex-col gap-6 p-4 overflow-y-auto h-full">
      {ideasTables.map((table) => (
        <SingleTable
          key={table.id}
          table={table}
          onUpdateTitle={(title) => updateTable(table.id, { title })}
          onUpdateColumnColor={(pillar, color) => updateColumnColor(table.id, pillar, color)}
          onUpdateColumnName={(oldName, newName) => updateColumnName(table.id, oldName, newName)}
          onUpdateIdea={(pillar, idx, text) => updateIdea(table.id, pillar, idx, text)}
          onAddIdea={(pillar) => addIdea(table.id, pillar)}
          onRemoveIdea={(pillar, idx) => removeIdea(table.id, pillar, idx)}
          onDelete={() => deleteTable(table.id)}
          canDelete={ideasTables.length > 1}
        />
      ))}
      <button
        onClick={addTable}
        className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-dashed border-gray-200 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={14} /> Add Platform
      </button>
    </div>
  );
}
