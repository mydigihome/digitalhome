import { StrategyRow } from "./types";
import AutoTextarea from "./AutoTextarea";
import { useState } from "react";

interface Props {
  strategy: StrategyRow[];
  setStrategy: (fn: StrategyRow[] | ((prev: StrategyRow[]) => StrategyRow[])) => void;
}

function EditableLabel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (editing) {
    return (
      <input
        autoFocus
        className="bg-transparent text-sm font-medium text-gray-800 outline-none w-full"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={e => { if (e.key === "Enter") { onChange(draft); setEditing(false); } }}
      />
    );
  }
  return (
    <span className="text-sm font-medium text-gray-800 cursor-pointer" onClick={() => setEditing(true)}>
      {value}
    </span>
  );
}

export default function StrategyTab({ strategy, setStrategy }: Props) {
  const updateValue = (idx: number, value: string) => {
    setStrategy(prev => {
      const rows = [...prev];
      rows[idx] = { ...rows[idx], value };
      return rows;
    });
  };

  const updateLabel = (idx: number, label: string) => {
    setStrategy(prev => {
      const rows = [...prev];
      rows[idx] = { ...rows[idx], label };
      return rows;
    });
  };

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-200 bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase text-gray-400 w-48">
              Section
            </th>
            <th className="border border-gray-200 bg-gray-50 px-4 py-2 text-left text-xs font-semibold uppercase text-gray-400">
              Details
            </th>
          </tr>
        </thead>
        <tbody>
          {strategy.map((row, idx) => (
            <tr key={idx}>
              <td className="border border-gray-200 px-4 py-3 align-top bg-gray-50/50">
                <EditableLabel value={row.label} onChange={v => updateLabel(idx, v)} />
              </td>
              <td className="border border-gray-200 px-0 py-0">
                <AutoTextarea
                  className="w-full px-4 py-3 text-sm bg-transparent outline-none text-gray-700 leading-relaxed"
                  value={row.value}
                  onChange={e => updateValue(idx, e.target.value)}
                  placeholder="Type here..."
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
