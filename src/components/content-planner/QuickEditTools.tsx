import { useState } from "react";
import { ExternalLink, Settings, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors text-muted-foreground">
            🛠️ Open in Editing Software
            <ChevronDown size={12} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {visibleTools.map(tool =>
            tool.url ? (
              <DropdownMenuItem key={tool.id} asChild>
                <a href={tool.url} target="_blank" rel="noreferrer" className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-2">
                    <span>{tool.icon}</span>
                    <span>{tool.label}</span>
                  </span>
                  <ExternalLink size={11} className="text-muted-foreground" />
                </a>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                key={tool.id}
                onClick={() => alert(`${tool.label} is a desktop application.\n\nOpen it directly on your Mac to edit your content.`)}
              >
                <span className="flex items-center gap-2">
                  <span>{tool.icon}</span>
                  <span>{tool.label}</span>
                </span>
              </DropdownMenuItem>
            )
          )}
          {visibleTools.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">No tools enabled</div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setShowSettings(s => !s); }}>
            <Settings size={13} className="mr-2" />
            <span>Manage Tools</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showSettings && (
        <div className="mt-2 p-2 border border-border rounded-lg bg-muted/50">
          <div className="text-[10px] text-muted-foreground mb-1.5">Select your editing tools:</div>
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
    </div>
  );
}
