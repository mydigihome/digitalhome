import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { HashtagGroup } from "./types";

interface Props {
  hashtagGroups: HashtagGroup[];
  setHashtagGroups: React.Dispatch<React.SetStateAction<HashtagGroup[]>>;
}

export default function HashtagManagerTab({ hashtagGroups, setHashtagGroups }: Props) {
  const [copied, setCopied] = useState(false);

  const allChecked = hashtagGroups.flatMap(g => g.hashtags.filter(h => h.checked));
  const hashString = allChecked.map(h => h.tag).join(" ");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hashString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCheck = (gIdx: number, hIdx: number) => {
    setHashtagGroups(prev => {
      const groups = [...prev];
      const tags = [...groups[gIdx].hashtags];
      tags[hIdx] = { ...tags[hIdx], checked: !tags[hIdx].checked };
      groups[gIdx] = { ...groups[gIdx], hashtags: tags };
      return groups;
    });
  };

  const updateTag = (gIdx: number, hIdx: number, tag: string) => {
    setHashtagGroups(prev => {
      const groups = [...prev];
      const tags = [...groups[gIdx].hashtags];
      tags[hIdx] = { ...tags[hIdx], tag };
      groups[gIdx] = { ...groups[gIdx], hashtags: tags };
      return groups;
    });
  };

  const updateSize = (gIdx: number, hIdx: number, size: string) => {
    setHashtagGroups(prev => {
      const groups = [...prev];
      const tags = [...groups[gIdx].hashtags];
      tags[hIdx] = { ...tags[hIdx], size };
      groups[gIdx] = { ...groups[gIdx], hashtags: tags };
      return groups;
    });
  };

  const updateGroupName = (gIdx: number, name: string) => {
    setHashtagGroups(prev => {
      const groups = [...prev];
      groups[gIdx] = { ...groups[gIdx], name };
      return groups;
    });
  };

  const addHashtag = (gIdx: number) => {
    setHashtagGroups(prev => {
      const groups = [...prev];
      groups[gIdx] = {
        ...groups[gIdx],
        hashtags: [...groups[gIdx].hashtags, { tag: "#new", size: "medium", checked: false }],
      };
      return groups;
    });
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Concatenation bar */}
      <div
        className="mb-4 flex items-center gap-3 rounded border p-3"
        style={{ borderColor: "#C9B99A", background: "#E8E0D5" }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "#2C2C2C" }}>
            Selected Hashtags ({allChecked.length})
          </div>
          <div className="text-xs break-all" style={{ color: "#2C2C2C" }}>
            {hashString || "Check hashtags to build your string…"}
          </div>
        </div>
        <button
          onClick={copyToClipboard}
          disabled={!hashString}
          className="shrink-0 rounded px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{ background: "#C9B99A", color: "#2C2C2C" }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Grid of groups */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {hashtagGroups.map((group, gIdx) => (
          <div key={group.id} className="rounded border" style={{ borderColor: "#E8E0D5", background: "#FAF7F2" }}>
            <input
              className="w-full border-b px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none"
              style={{ background: "#E8E0D5", color: "#2C2C2C", borderColor: "#C9B99A" }}
              value={group.name}
              onChange={e => updateGroupName(gIdx, e.target.value)}
            />
            <div className="p-2">
              {group.hashtags.map((h, hIdx) => (
                <div key={hIdx} className="flex items-center gap-1.5 py-0.5">
                  <input
                    type="checkbox"
                    checked={h.checked}
                    onChange={() => toggleCheck(gIdx, hIdx)}
                    className="h-3 w-3 accent-[#C9B99A]"
                  />
                  <input
                    className="flex-1 bg-transparent text-xs outline-none"
                    style={{ color: "#2C2C2C" }}
                    value={h.tag}
                    onChange={e => updateTag(gIdx, hIdx, e.target.value)}
                  />
                  <select
                    value={h.size}
                    onChange={e => updateSize(gIdx, hIdx, e.target.value)}
                    className="bg-transparent text-[10px] outline-none"
                    style={{ color: "#C9B99A" }}
                  >
                    <option value="small">S</option>
                    <option value="medium">M</option>
                    <option value="large">L</option>
                    <option value="niche">N</option>
                  </select>
                </div>
              ))}
              <button
                onClick={() => addHashtag(gIdx)}
                className="mt-1 text-[10px] font-semibold"
                style={{ color: "#C9B99A" }}
              >
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
