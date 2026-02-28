import { useState } from "react";
import { ExternalLink, Settings } from "lucide-react";

const ALL_TOOLS = [
  { id: "canva", label: "Canva", icon: "🎨", url: "https://canva.com", desc: "Design graphics" },
  { id: "capcut", label: "CapCut", icon: "🎬", url: "https://capcut.com", desc: "Edit videos" },
  { id: "descript", label: "Descript", icon: "🎙️", url: "https://descript.com", desc: "Edit audio & video" },
  { id: "finalcut", label: "Final Cut Pro", icon: "🎞️", url: "", desc: "macOS only" },
] as const;

const STORAGE_KEY = "cp-editing-tools";

function getEnabledTools(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return ALL_TOOLS.map(t => t.id);
}

export default function QuickEditTools() {
  const [enabled, setEnabled] = useState<string[]>(getEnabledTools);
  const [showSettings, setShowSettings] = useState(false);

  const toggle = (id: string) => {
    setEnabled(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const visibleTools = ALL_TOOLS.filter(t => enabled.includes(t.id));

  return (
    <div className="mt-3.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Open in Editing Software</span>
        <button onClick={() => setShowSettings(!showSettings)} className="text-gray-400 hover:text-gray-600">
          <Settings size={13} />
        </button>
      </div>

      {showSettings && (
        <div className="mb-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-[10px] text-gray-500 mb-1.5">Select your editing tools:</div>
          <div className="flex flex-wrap gap-2">
            {ALL_TOOLS.map(t => (
              <label key={t.id} className="flex items-center gap-1 text-xs cursor-pointer">
                <input type="checkbox" checked={enabled.includes(t.id)} onChange={() => toggle(t.id)} className="h-3 w-3" />
                {t.icon} {t.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {visibleTools.map(tool => (
          tool.url ? (
            <a
              key={tool.id}
              href={tool.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            >
              <span>{tool.icon}</span>
              <span>{tool.label}</span>
              <ExternalLink size={10} className="text-gray-400" />
            </a>
          ) : (
            <button
              key={tool.id}
              onClick={() => alert(`${tool.label} is a desktop application.\n\nOpen it directly on your Mac to edit your content.`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 cursor-pointer"
            >
              <span>{tool.icon}</span>
              <span>{tool.label}</span>
            </button>
          )
        ))}
      </div>
    </div>
  );
}
