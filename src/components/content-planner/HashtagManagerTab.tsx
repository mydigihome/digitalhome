import { useState } from "react";
import { Copy, Check, Plus, X, ChevronDown, ChevronUp, Shield, Users, MonitorSmartphone, Video, MessageSquare, Search } from "lucide-react";
import { HashtagGroup } from "./types";
import CaptionIdeasSection from "./CaptionIdeasSection";
import BrandCollabsSection from "./BrandCollabsSection";

interface Props {
  hashtagGroups: HashtagGroup[];
  setHashtagGroups: (fn: HashtagGroup[] | ((prev: HashtagGroup[]) => HashtagGroup[])) => void;
}

const GROUP_ICONS = [Shield, Users, MonitorSmartphone, Video, MessageSquare];
const GROUP_ICON_COLORS = ["#6366F1", "#EC4899", "#3B82F6", "#F59E0B", "#10B981"];

export default function HashtagManagerTab({ hashtagGroups, setHashtagGroups }: Props) {
  const [copied, setCopied] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (hashtagGroups.length > 0) init[hashtagGroups[0].id] = true;
    return init;
  });
  const [searchQuery, setSearchQuery] = useState("");

  const allChecked = hashtagGroups.flatMap(g => g.hashtags.filter(h => h.checked));
  const hashString = allChecked.map(h => h.tag).join(" ");

  const copyToClipboard = () => {
    navigator.clipboard.writeText(hashString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
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
    <div className="flex flex-col h-full" style={{ background: "linear-gradient(180deg, #F0EDFF 0%, #FAFBFF 15%, #FFFFFF 40%)" }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: "#6366F1" }} />
          <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#6B7280" }}>
            Digital Home OS
          </span>
        </div>
        <div className="flex items-center justify-between">
          <h1 style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontSize: 32, fontWeight: 700, color: "#1A1A2E" }}>
            Hashtag <span style={{ fontStyle: "italic" }}>Studio</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
              <input
                className="pl-9 pr-4 py-2 rounded-full text-sm bg-white outline-none"
                style={{ border: "1px solid #E5E7EB", width: 180 }}
                placeholder="Search tags..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 mt-4">
          {["My Library", "Trending Now", "AI Suggestions"].map((pill, i) => (
            <button
              key={pill}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                i === 0 ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:bg-white/60"
              }`}
              style={{ border: i === 0 ? "1px solid #E5E7EB" : "1px solid transparent" }}
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Groups */}
      <div className="flex-1 overflow-auto px-6 pb-4 space-y-3">
        {hashtagGroups.map((group, gIdx) => {
          const isExpanded = expandedGroups[group.id];
          const Icon = GROUP_ICONS[gIdx % GROUP_ICONS.length];
          const iconColor = GROUP_ICON_COLORS[gIdx % GROUP_ICON_COLORS.length];
          const checkedCount = group.hashtags.filter(h => h.checked).length;
          const totalCount = group.hashtags.length;

          return (
            <div key={group.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #F0F0F0" }}>
              {/* Group header */}
              <button
                onClick={() => toggleExpand(group.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${iconColor}15` }}>
                  <Icon size={18} style={{ color: iconColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    className="text-sm font-bold uppercase tracking-wider bg-transparent outline-none w-full"
                    style={{ color: "#1A1A2E" }}
                    value={group.name}
                    onChange={e => updateGroupName(gIdx, e.target.value)}
                    onClick={e => e.stopPropagation()}
                  />
                  <span className="text-[11px]" style={{ color: iconColor }}>
                    {checkedCount > 0 ? `${checkedCount} Selected` : `${totalCount} Tags Available`}
                  </span>
                </div>
                {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-4 border-t" style={{ borderColor: "#F5F5F5" }}>
                  <div className="flex items-center justify-between py-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#6366F1" }}>
                      Available Tags
                    </span>
                    <button
                      onClick={() => {
                        setHashtagGroups(prev => {
                          const groups = [...prev];
                          const tags = groups[gIdx].hashtags.map(h => ({ ...h, checked: true }));
                          groups[gIdx] = { ...groups[gIdx], hashtags: tags };
                          return groups;
                        });
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
                      style={{ color: "#6366F1", border: "1px solid #E5E7EB" }}
                    >
                      Copy All
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {group.hashtags.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-3 py-2.5 group rounded-lg hover:bg-gray-50 px-2 -mx-2 transition-colors">
                        <button
                          onClick={() => toggleCheck(gIdx, hIdx)}
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                          style={{
                            background: h.checked ? "#6366F1" : "transparent",
                            border: h.checked ? "none" : "2px solid #D1D5DB",
                          }}
                        >
                          {h.checked && <Check size={14} className="text-white" />}
                        </button>
                        <input
                          className="flex-1 text-sm bg-transparent outline-none"
                          style={{ color: "#374151" }}
                          value={h.tag}
                          onChange={e => updateTag(gIdx, hIdx, e.target.value)}
                        />
                        <select
                          value={h.size}
                          onChange={e => updateSize(gIdx, hIdx, e.target.value)}
                          className="bg-transparent text-[11px] outline-none font-medium"
                          style={{ color: "#9CA3AF" }}
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
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => addHashtag(gIdx)}
                    className="w-full py-2 mt-2 text-xs font-medium flex items-center justify-center gap-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                    style={{ color: "#6366F1", border: "1px dashed #D1D5DB" }}
                  >
                    <Plus size={12} /> Add Tag
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating copy button */}
      {allChecked.length > 0 && (
        <div className="px-6 pb-4 pt-2">
          <button
            onClick={copyToClipboard}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", display: "flex" }}
          >
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Selection ({allChecked.length})</>}
          </button>
        </div>
      )}

      {/* Caption Ideas Section */}
      <div className="px-4 pb-2">
        <CaptionIdeasSection />
      </div>

      {/* Brand Collaborations Section */}
      <div className="px-4 pb-4">
        <BrandCollabsSection />
      </div>
    </div>
  );
}
