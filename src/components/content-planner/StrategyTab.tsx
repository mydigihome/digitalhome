import { StrategyRow } from "./types";
import AutoTextarea from "./AutoTextarea";
import { useState } from "react";
import { Target, Users, Columns3, TrendingUp, Megaphone, Palette, BarChart3 } from "lucide-react";

interface Props {
  strategy: StrategyRow[];
  setStrategy: (fn: StrategyRow[] | ((prev: StrategyRow[]) => StrategyRow[])) => void;
}

const ROW_ICONS = [Target, Users, Columns3, TrendingUp, Megaphone, Palette, BarChart3];
const ROW_ICON_COLORS = ["#6366F1", "#EC4899", "#6366F1", "#10B981", "#F59E0B", "#8B5CF6", "#3B82F6"];

function EditableLabel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  if (editing) {
    return (
      <input
        autoFocus
        className="bg-transparent outline-none w-full"
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 22, fontStyle: "italic", fontWeight: 700, color: "#1A1A2E" }}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { onChange(draft); setEditing(false); }}
        onKeyDown={e => { if (e.key === "Enter") { onChange(draft); setEditing(false); } }}
      />
    );
  }
  return (
    <span
      className="cursor-pointer hover:opacity-80 transition-opacity"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 22, fontStyle: "italic", fontWeight: 700, color: "#1A1A2E" }}
      onClick={() => setEditing(true)}
    >
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
    <div className="h-full overflow-auto" style={{ background: "linear-gradient(180deg, #F0EDFF 0%, #FAFBFF 15%, #FFFFFF 40%)" }}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6366F1" }}>
              ✦ Vision & Strategy
            </span>
          </div>
          <h1 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 36, fontStyle: "italic", fontWeight: 700, color: "#1A1A2E", marginBottom: 8 }}>
            The Brand Book
          </h1>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Defining the core essence and trajectory of your digital presence.
          </p>
        </div>

        {/* Strategy Cards */}
        <div className="space-y-6">
          {strategy.map((row, idx) => {
            const Icon = ROW_ICONS[idx % ROW_ICONS.length];
            const iconColor = ROW_ICON_COLORS[idx % ROW_ICON_COLORS.length];
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 transition-shadow hover:shadow-md"
                style={{ border: "1px solid #F0F0F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <EditableLabel value={row.label} onChange={v => updateLabel(idx, v)} />
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${iconColor}15` }}
                  >
                    <Icon size={18} style={{ color: iconColor }} />
                  </div>
                </div>
                <AutoTextarea
                  className="w-full text-sm bg-transparent outline-none leading-relaxed"
                  style={{ color: "#4B5563" }}
                  value={row.value}
                  onChange={e => updateValue(idx, e.target.value)}
                  placeholder="Type here..."
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
