import { SetupData, StatusItem, PlatformItem } from "./types";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface Props {
  setup: SetupData;
  setSetup: (fn: SetupData | ((prev: SetupData) => SetupData)) => void;
}

type ListKey = "contentPillars" | "contentFormats" | "goals";

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
    setSetup(prev => ({ ...prev, statuses: [...prev.statuses, { label: "", color: "#E5E7EB" }] }));
  };

  const removeStatus = (idx: number) => {
    setSetup(prev => ({ ...prev, statuses: prev.statuses.filter((_, i) => i !== idx) }));
  };

  const updatePlatform = (idx: number, patch: Partial<PlatformItem>) => {
    setSetup(prev => {
      const platforms = [...prev.platforms];
      platforms[idx] = { ...platforms[idx], ...patch };
      return { ...prev, platforms };
    });
  };

  const addPlatform = () => {
    setSetup(prev => ({ ...prev, platforms: [...prev.platforms, { name: "", color: "#6B7280" }] }));
  };

  const removePlatform = (idx: number) => {
    setSetup(prev => ({ ...prev, platforms: prev.platforms.filter((_, i) => i !== idx) }));
  };

  const lists: { key: ListKey; label: string }[] = [
    { key: "contentPillars", label: "Content Pillars" },
    { key: "contentFormats", label: "Content Format" },
    { key: "goals", label: "Goals" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 h-full">
      {/* Regular lists */}
      {lists.map(({ key, label }) => (
        <div key={key} className="border-r border-gray-100 last:border-r-0">
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
            <EditableHeader value={label} onChange={() => {}} />
          </div>
          <div className="divide-y divide-gray-50">
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
      <div className="border-r border-gray-100 last:border-r-0">
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
          <EditableHeader value="Status" onChange={() => {}} />
        </div>
        <div className="divide-y divide-gray-50">
          {setup.statuses.map((status, idx) => (
            <div key={idx} className="flex items-center group">
              <div className="px-2">
                <input
                  type="color"
                  value={status.color}
                  onChange={e => updateStatus(idx, { color: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border border-gray-200 p-0"
                  style={{ background: status.color }}
                />
              </div>
              <input
                className="flex-1 px-1 py-2 text-sm bg-transparent outline-none text-gray-800"
                value={status.label}
                onChange={e => updateStatus(idx, { label: e.target.value })}
                placeholder="Status name..."
              />
              <span
                className="text-[10px] px-2 py-0.5 rounded-full mr-1"
                style={{ background: status.color, color: "#374151" }}
              >
                Preview
              </span>
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

      {/* Platform column with brand colors */}
      <div className="border-r border-gray-100 last:border-r-0">
        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/50">
          <EditableHeader value="Platform" onChange={() => {}} />
        </div>
        <div className="divide-y divide-gray-50">
          {setup.platforms.map((platform, idx) => (
            <div key={idx} className="flex items-center group">
              <div className="px-2">
                <input
                  type="color"
                  value={platform.color}
                  onChange={e => updatePlatform(idx, { color: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border border-gray-200 p-0"
                />
              </div>
              <input
                className="flex-1 px-1 py-2 text-sm bg-transparent outline-none text-gray-800"
                value={platform.name}
                onChange={e => updatePlatform(idx, { name: e.target.value })}
                placeholder="Platform name..."
              />
              <span
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full text-white mr-1"
                style={{ background: platform.color }}
              >
                {platform.name || "Tag"}
              </span>
              <button
                onClick={() => removePlatform(idx)}
                className="px-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addPlatform}
          className="w-full px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center gap-1 transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </div>
    </div>
  );
}
