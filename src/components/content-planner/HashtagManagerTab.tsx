import { useState } from "react";
import { Copy, Check, Plus, X } from "lucide-react";
import { HashtagGroup } from "./types";

interface Props {
  hashtagGroups: HashtagGroup[];
  setHashtagGroups: (fn: HashtagGroup[] | ((prev: HashtagGroup[]) => HashtagGroup[])) => void;
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
        hashtags: [...groups[gIdx].hashtags, { tag: "#", size: "medium", checked: false }],
      };
      return groups;
    });
  };

  const removeHashtag = (gIdx: number, hIdx: number) => {
    setHashtagGroups(prev => {
      const groups = [...prev];
      groups[gIdx] = {
        ...groups[gIdx],
        hashtags: groups[gIdx].hashtags.filter((_, i) => i !== hIdx),
      };
      return groups;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase text-gray-400 mb-0.5">
            Selected ({allChecked.length})
          </div>
          <div className="text-xs text-gray-600 break-all leading-relaxed">
            {hashString || "Check hashtags to build your string..."}
          </div>
        </div>
        <button
          onClick={copyToClipboard}
          disabled={!hashString}
          className="shrink-0 px-3 py-1.5 text-xs font-medium bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-30 transition-colors flex items-center gap-1"
        >
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {hashtagGroups.map((group, gIdx) => (
          <div key={group.id} className="border border-gray-200 rounded">
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
              <input
                className="text-xs font-semibold uppercase tracking-wider text-gray-700 bg-transparent outline-none w-full"
                value={group.name}
                onChange={e => updateGroupName(gIdx, e.target.value)}
              />
            </div>
            <div className="p-2 divide-y divide-gray-50">
              {group.hashtags.map((h, hIdx) => (
                <div key={hIdx} className="flex items-center gap-1.5 py-1 group">
                  <input
                    type="checkbox"
                    checked={h.checked}
                    onChange={() => toggleCheck(gIdx, hIdx)}
                    className="h-3 w-3 rounded border-gray-300"
                  />
                  <input
                    className="flex-1 text-xs bg-transparent outline-none text-gray-700"
                    value={h.tag}
                    onChange={e => updateTag(gIdx, hIdx, e.target.value)}
                  />
                  <select
                    value={h.size}
                    onChange={e => updateSize(gIdx, hIdx, e.target.value)}
                    className="bg-transparent text-[10px] outline-none text-gray-400"
                  >
                    <option value="small">S</option>
                    <option value="medium">M</option>
                    <option value="large">L</option>
                    <option value="niche">N</option>
                  </select>
                  <button
                    onClick={() => removeHashtag(gIdx, hIdx)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addHashtag(gIdx)}
              className="w-full px-3 py-1.5 text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center gap-1 border-t border-gray-200 transition-colors"
            >
              <Plus size={10} /> Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
