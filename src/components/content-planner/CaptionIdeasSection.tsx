import { useState } from "react";
import { Plus, Copy, Check, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { useCaptionIdeas, useCreateCaptionIdea, useDeleteCaptionIdea } from "@/hooks/useCaptionIdeas";

const CATEGORIES = ["General", "Hook", "CTA", "Story", "Educational", "Promotional"];

export default function CaptionIdeasSection() {
  const { data: ideas = [] } = useCaptionIdeas();
  const createIdea = useCreateCaptionIdea();
  const deleteIdea = useDeleteCaptionIdea();

  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("General");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = ideas.filter(i => {
    if (filterCat && i.category !== filterCat) return false;
    if (search && !i.caption_text.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSave = async () => {
    if (!text.trim()) return;
    try {
      await createIdea.mutateAsync({ caption_text: text.trim(), category });
      setText("");
      setCategory("General");
      setShowForm(false);
      toast.success("Caption saved!");
    } catch { toast.error("Failed to save"); }
  };

  const handleCopy = (id: string, caption: string) => {
    navigator.clipboard.writeText(caption);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="border-t border-gray-200 mt-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Caption Ideas</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Plus size={12} /> New Caption Idea
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-3 border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your caption idea..."
            className="w-full text-xs bg-white border border-gray-200 rounded p-2 outline-none resize-none"
            rows={3}
          />
          <div className="flex items-center gap-2">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <button onClick={handleSave} className="ml-auto text-xs bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700">Save</button>
            <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Search/Filter */}
      {ideas.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search captions..."
              className="w-full text-xs border border-gray-200 rounded pl-7 pr-2 py-1.5 outline-none bg-white"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterCat(null)}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${!filterCat ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >All</button>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setFilterCat(filterCat === c ? null : c)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${filterCat === c ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >{c}</button>
            ))}
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map(idea => (
          <div key={idea.id} className="border border-gray-200 rounded-lg p-3 bg-white group">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{idea.category}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleCopy(idea.id, idea.caption_text)} className="text-gray-400 hover:text-gray-600">
                  {copiedId === idea.id ? <Check size={12} /> : <Copy size={12} />}
                </button>
                <button onClick={() => deleteIdea.mutate(idea.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{idea.caption_text}</p>
            <div className="text-[10px] text-gray-400 mt-1.5">
              {new Date(idea.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !showForm && (
        <p className="text-xs text-gray-400 text-center py-3">No caption ideas yet</p>
      )}
    </div>
  );
}
