import { SetupData, StatusItem } from "./types";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  setup: SetupData;
  setSetup: (fn: SetupData | ((prev: SetupData) => SetupData)) => void;
}

type ListKey = "contentPillars" | "contentFormats" | "platforms" | "goals";

const PASTEL_OPTIONS = ["#e5e7eb", "#fef08a", "#fed7aa", "#fca5a5", "#bfdbfe", "#ddd6fe", "#bbf7d0", "#fbcfe8", "#a5f3fc"];

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

export default function SetupTab({ setup, setSetup }: Props) {
  const updateList = (key: ListKey, idx: number, value: string) => {
    setSetup(prev => {
      const arr = [...prev[key]];
      arr[idx] = value;
      return { ...prev, [key]: arr };
    });
  };

  const addToList = (key: ListKey) => {
    setSetup(prev => ({ ...prev, [key]: [...prev[key], ""] }));
  };

  const removeFromList = (key: ListKey, idx: number) => {
    setSetup(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) }));
  };

  const updateStatus = (idx: number, patch: Partial<StatusItem>) => {
    setSetup(prev => {
      const statuses = [...prev.statuses];
      statuses[idx] = { ...statuses[idx], ...patch };
      return { ...prev, statuses };
    });
  };

  const addStatus = () => {
    setSetup(prev => ({ ...prev, statuses: [...prev.statuses, { label: "", color: "#e5e7eb" }] }));
  };

  const removeStatus = (idx: number) => {
    setSetup(prev => ({ ...prev, statuses: prev.statuses.filter((_, i) => i !== idx) }));
  };

  const lists: { key: ListKey; label: string }[] = [
    { key: "contentPillars", label: "Content Pillars" },
    { key: "contentFormats", label: "Content Format" },
    { key: "platforms", label: "Platform" },
    { key: "goals", label: "Goals" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 h-full">
      {/* Regular lists */}
      {lists.map(({ key, label }) => (
        <div key={key} className="border-r border-gray-200 last:border-r-0">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <EditableHeader value={label} onChange={() => {}} />
          </div>
          <div className="divide-y divide-gray-100">
            {setup[key].map((item, idx) => (
              <div key={idx} className="flex items-center group">
                <input
                  className="flex-1 px-3 py-2 text-sm bg-transparent outline-none text-gray-800"
                  value={item}
                  onChange={e => updateList(key, idx, e.target.value)}
                  placeholder="Type..."
                />
                <button
                  onClick={() => removeFromList(key, idx)}
                  className="px-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addToList(key)}
            className="w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center gap-1 transition-colors"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      ))}

      {/* Status column with colors */}
      <div className="border-r border-gray-200 last:border-r-0">
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <EditableHeader value="Status" onChange={() => {}} />
        </div>
        <div className="divide-y divide-gray-100">
          {setup.statuses.map((status, idx) => (
            <div key={idx} className="flex items-center group">
              <div className="relative px-2">
                <span
                  className="inline-block w-4 h-4 rounded cursor-pointer border border-gray-200"
                  style={{ background: status.color }}
                />
                <select
                  className="absolute inset-0 opacity-0 cursor-pointer w-8"
                  value={status.color}
                  onChange={e => updateStatus(idx, { color: e.target.value })}
                >
                  {PASTEL_OPTIONS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <input
                className="flex-1 px-1 py-2 text-sm bg-transparent outline-none text-gray-800"
                value={status.label}
                onChange={e => updateStatus(idx, { label: e.target.value })}
                placeholder="Status name..."
              />
              <button
                onClick={() => removeStatus(idx)}
                className="px-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addStatus}
          className="w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center gap-1 transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}
