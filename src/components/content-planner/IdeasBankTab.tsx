import { SetupData, IdeaEntry, IdeasTable } from "./types";
import { Plus, X, Search, Bell, ArrowRight, Sparkles } from "lucide-react";
import AutoTextarea from "./AutoTextarea";
import { useState, useRef } from "react";

const PILLAR_COLORS = ["#FFF5F0", "#F0F7FF", "#FFF0F8", "#F0FFF4", "#FFF8E0", "#F0FFFF", "#FFF0FF"];
const TABLE_LABEL_COLORS = ["#EF4444", "#6366F1", "#F59E0B", "#10B981", "#EC4899", "#3B82F6"];

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
        className="bg-transparent outline-none uppercase text-xs font-bold tracking-widest"
        style={{ color: "inherit" }}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={e => { if (e.key === "Enter") { onChange(draft); setEditing(false); } }}
      />
    );
  }
  return (
    <span
      className="uppercase text-xs font-bold tracking-widest cursor-pointer hover:opacity-70 transition-opacity"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value || "Untitled"}
    </span>
  );
}

function EditableHeader({ value, onChange, count }: { value: string; onChange: (v: string) => void; count: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (editing) {
    return (
      <input
        autoFocus
        className="bg-transparent text-[13px] font-bold uppercase tracking-wider outline-none w-full"
        style={{ color: "#374151" }}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={e => { if (e.key === "Enter") { onChange(draft); setEditing(false); } }}
      />
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] font-bold uppercase tracking-wider cursor-pointer" style={{ color: "#374151" }} onClick={() => { setDraft(value); setEditing(true); }}>
        {value}
      </span>
      {count > 0 && (
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "#F3F4F6", color: "#6B7280" }}>
          {count}
        </span>
      )}
    </div>
  );
}

function ColorDot({ color, onChange }: { color: string; onChange: (c: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        className="w-3 h-3 rounded-full shrink-0 cursor-pointer hover:scale-110 transition-transform"
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
  tableIndex,
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
  tableIndex: number;
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
  const labelColor = TABLE_LABEL_COLORS[tableIndex % TABLE_LABEL_COLORS.length];

  return (
    <div className="mb-8">
      {/* Platform section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <EditableTitle value={table.title} onChange={onUpdateTitle} />
          <div className="h-px flex-1 min-w-[40px]" style={{ background: `${labelColor}40` }} />
          {canDelete && (
            <button
              onClick={onDelete}
              className="text-gray-300 hover:text-red-400 transition-colors p-1"
              title="Remove table"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider hover:opacity-70 transition-opacity" style={{ color: "#6B7280" }}>
          Archive <ArrowRight size={12} />
        </button>
      </div>

      {/* Columns as horizontal cards */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(pillars.length, 4)}, minmax(0, 1fr))` }}>
        {pillars.map((pillar) => {
          const ideas = table.ideas[pillar] || [];
          const colColor = table.columnColors[pillar] || PILLAR_COLORS[pillars.indexOf(pillar) % PILLAR_COLORS.length];
          return (
            <div key={pillar} className="flex flex-col">
              {/* Column header */}
              <div className="flex items-center gap-1.5 mb-3">
                <ColorDot color={labelColor} onChange={(c) => onUpdateColumnColor(pillar, c)} />
                <EditableHeader
                  value={pillar}
                  onChange={(newName) => onUpdateColumnName(pillar, newName)}
                  count={ideas.length}
                />
              </div>

              {/* Idea cards */}
              <div className="space-y-2 flex-1">
                {ideas.map((idea, idx) => (
                  <div
                    key={idea.id}
                    className="bg-white rounded-xl p-3 group hover:shadow-md transition-all duration-150 relative"
                    style={{ border: "1px solid #F0F0F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                  >
                    <AutoTextarea
                      className="w-full text-[13px] bg-transparent outline-none leading-snug resize-none"
                      style={{ color: "#374151" }}
                      value={idea.text}
                      onChange={e => onUpdateIdea(pillar, idx, e.target.value)}
                      placeholder="Type idea..."
                    />
                    {idea.text && (
                      <div className="flex items-center justify-between mt-2">
                        <ColorDot color={colColor} onChange={() => {}} />
                        <button
                          onClick={() => onRemoveIdea(pillar, idx)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add idea card */}
              <button
                onClick={() => onAddIdea(pillar)}
                className="w-full mt-2 py-3 flex items-center justify-center gap-1.5 text-[12px] font-medium hover:bg-white/80 transition-all duration-150 cursor-pointer"
                style={{ border: "1.5px dashed #D1D5DB", borderRadius: 12, color: "#9CA3AF" }}
              >
                <Plus size={12} /> New Idea
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
  const [searchQuery, setSearchQuery] = useState("");

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
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: "linear-gradient(180deg, #F0EDFF 0%, #FAFBFF 8%, #FFFFFF 25%)" }}>
      {/* Stitch Header */}
      <div className="px-6 pt-6 pb-4 flex items-start justify-between">
        <h1 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 32, fontStyle: "italic", fontWeight: 700, color: "#1A1A2E" }}>
          Ideas Bank
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
            <input
              className="pl-8 pr-4 py-2 rounded-full text-sm bg-white outline-none"
              style={{ border: "1px solid #E5E7EB", width: 160 }}
              placeholder="Search ideas"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors" style={{ border: "1px solid #E5E7EB" }}>
            <Bell size={16} style={{ color: "#6B7280" }} />
          </button>
          <button
            onClick={addTable}
            className="px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
          >
            New Campaign
          </button>
        </div>
      </div>

      {/* Platform Tables */}
      <div className="px-6 pb-6">
        {ideasTables.map((table, idx) => (
          <SingleTable
            key={table.id}
            table={table}
            tableIndex={idx}
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

        {/* Add new column / platform card */}
        <button
          onClick={addTable}
          className="w-full py-8 flex flex-col items-center justify-center gap-2 hover:bg-white/60 transition-all duration-150 cursor-pointer"
          style={{ border: "1.5px dashed #D1D5DB", borderRadius: 16 }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
            <Plus size={16} style={{ color: "#9CA3AF" }} />
          </div>
          <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#9CA3AF" }}>
            New Column
          </span>
        </button>
      </div>
    </div>
  );
}
