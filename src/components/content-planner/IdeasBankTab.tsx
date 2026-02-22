import { SetupData, IdeaEntry } from "./types";
import { Plus, X } from "lucide-react";
import AutoTextarea from "./AutoTextarea";
import { useState } from "react";

interface Props {
  setup: SetupData;
  ideas: Record<string, IdeaEntry[]>;
  setIdeas: (fn: Record<string, IdeaEntry[]> | ((prev: Record<string, IdeaEntry[]>) => Record<string, IdeaEntry[]>)) => void;
}

// Soft pastel backgrounds for pillar columns
const PILLAR_COLORS = ["#FFF5F0", "#F0F7FF", "#FFF0F8", "#F0FFF4", "#FFF8E0", "#F0FFFF", "#FFF0FF"];

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
    <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 cursor-pointer" onClick={() => setEditing(true)}>
      {value}
    </span>
  );
}

export default function IdeasBankTab({ setup, ideas, setIdeas }: Props) {
  const pillars = setup.contentPillars.filter(p => p.trim());

  const updateIdea = (pillar: string, idx: number, text: string) => {
    setIdeas(prev => {
      const arr = [...(prev[pillar] || [])];
      if (idx < arr.length) {
        arr[idx] = { ...arr[idx], text };
      }
      return { ...prev, [pillar]: arr };
    });
  };

  const addIdea = (pillar: string) => {
    setIdeas(prev => ({
      ...prev,
      [pillar]: [...(prev[pillar] || []), { id: crypto.randomUUID(), text: "" }],
    }));
  };

  const removeIdea = (pillar: string, idx: number) => {
    setIdeas(prev => ({
      ...prev,
      [pillar]: (prev[pillar] || []).filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${pillars.length}, minmax(0, 1fr))` }}>
      {pillars.map((pillar, pi) => (
        <div key={pillar} className="border-r border-gray-100 last:border-r-0 flex flex-col">
          <div
            className="px-3 py-2 border-b border-gray-100"
            style={{ background: PILLAR_COLORS[pi % PILLAR_COLORS.length] }}
          >
            <EditableHeader value={pillar} onChange={() => {}} />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {(ideas[pillar] || []).map((idea, idx) => (
              <div key={idea.id} className="flex group">
                <AutoTextarea
                  className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-gray-700"
                  value={idea.text}
                  onChange={e => updateIdea(pillar, idx, e.target.value)}
                  placeholder="Type idea..."
                />
                <button
                  onClick={() => removeIdea(pillar, idx)}
                  className="px-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addIdea(pillar)}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 border-t border-gray-100 transition-colors"
          >
            <Plus size={10} /> Add Idea
          </button>
        </div>
      ))}
    </div>
  );
}
