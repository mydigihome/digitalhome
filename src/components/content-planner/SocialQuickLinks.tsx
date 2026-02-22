import { useState } from "react";
import { Settings, ExternalLink, X } from "lucide-react";
import { SocialLink, getPlatformColor, DEFAULT_PLATFORM_COLORS } from "./types";

interface Props {
  links: SocialLink[];
  setLinks: (fn: SocialLink[] | ((prev: SocialLink[]) => SocialLink[])) => void;
}

const PLATFORM_ICONS: Record<string, string> = {
  YouTube: "▶",
  Instagram: "◎",
  TikTok: "♪",
  Substack: "✉",
  Pinterest: "📌",
};

export default function SocialQuickLinks({ links, setLinks }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center gap-1 relative">
      {links.map((link, i) => (
        <a
          key={link.platform}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={link.platform}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold hover:opacity-80 transition-opacity"
          style={{ background: getPlatformColor(DEFAULT_PLATFORM_COLORS, link.platform) }}
        >
          {PLATFORM_ICONS[link.platform] || link.platform[0]}
        </a>
      ))}
      <button
        onClick={() => setEditing(!editing)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <Settings size={13} />
      </button>

      {editing && (
        <div className="absolute top-9 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-72 z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Edit Profile URLs</span>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {links.map((link, i) => (
              <div key={link.platform} className="flex items-center gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                  style={{ background: getPlatformColor(DEFAULT_PLATFORM_COLORS, link.platform) }}
                >
                  {PLATFORM_ICONS[link.platform] || link.platform[0]}
                </span>
                <input
                  className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5 outline-none text-gray-700"
                  value={link.url}
                  onChange={e => {
                    const url = e.target.value;
                    setLinks(prev => prev.map((l, j) => j === i ? { ...l, url } : l));
                  }}
                  placeholder={`${link.platform} profile URL`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
