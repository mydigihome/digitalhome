import { useState } from "react";
import { Plus, X, Calendar, LayoutGrid, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Stream = {
  id: string;
  name: string;
  type: string;
  monthlyRevenue: number;
  notes: string;
};

type Idea = {
  id: string;
  text: string;
  platform: string;
  contentType: string;
  date: string;
};

const MOCK_IDEAS: Idea[] = [
  { id: "1", text: "Behind the scenes of my morning routine", platform: "Instagram", contentType: "Reel", date: "Mar 27" },
  { id: "2", text: "Top 5 tools I use to run my business", platform: "Instagram", contentType: "Carousel", date: "Mar 26" },
  { id: "3", text: "Why I stopped posting daily", platform: "YouTube", contentType: "Video", date: "Mar 25" },
  { id: "4", text: "Brand deal red flags to watch out for", platform: "Twitter/X", contentType: "Post", date: "Mar 24" },
];

const CONTENT_TYPES = ["All", "Reel", "Post", "Video", "Carousel"];
const STREAM_TYPES = ["Podcast", "Membership", "Newsletter", "Merchandise", "Digital Products", "Coaching", "Other"];

const MOCK_CONTENT = [
  { id: "1", title: "Weekly Tips Reel", platforms: ["Instagram"], status: "in_progress", date: "Next Tuesday" },
  { id: "2", title: "YouTube Tutorial", platforms: ["YouTube"], status: "idea", date: "" },
  { id: "3", title: "Brand Partnership Post", platforms: ["Instagram", "TikTok"], status: "scheduled", date: "Apr 2" },
  { id: "4", title: "Productivity Hacks Thread", platforms: ["Twitter/X"], status: "idea", date: "" },
  { id: "5", title: "BTS Studio Setup", platforms: ["Instagram", "YouTube"], status: "published", date: "Mar 25" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  idea: { label: "Ideas", color: "#9ca3af" },
  in_progress: { label: "In Progress", color: "#f59e0b" },
  scheduled: { label: "Scheduled", color: "#6366f1" },
  published: { label: "Published", color: "#16a34a" },
};

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E1306C", YouTube: "#FF0000", TikTok: "#000000", "Twitter/X": "#1DA1F2",
};

export default function StudioHQView() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [showAddStream, setShowAddStream] = useState(false);
  const [newStream, setNewStream] = useState({ name: "", type: "Podcast", monthlyRevenue: 0, notes: "" });
  const [ideas, setIdeas] = useState<Idea[]>(MOCK_IDEAS);
  const [newIdea, setNewIdea] = useState("");
  const [ideaFilter, setIdeaFilter] = useState("All");
  const [planView, setPlanView] = useState<"kanban" | "calendar">("kanban");
  const [showContentPanel, setShowContentPanel] = useState(false);

  const addStream = () => {
    if (!newStream.name.trim()) return;
    setStreams(prev => [...prev, { ...newStream, id: Date.now().toString() }]);
    setNewStream({ name: "", type: "Podcast", monthlyRevenue: 0, notes: "" });
    setShowAddStream(false);
  };

  const addIdea = () => {
    if (!newIdea.trim()) return;
    setIdeas(prev => [{ id: Date.now().toString(), text: newIdea, platform: "", contentType: "", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) }, ...prev]);
    setNewIdea("");
  };

  const filteredIdeas = ideaFilter === "All" ? ideas : ideas.filter(i => i.contentType === ideaFilter);

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      {/* Revenue Streams */}
      <div className="bg-white dark:bg-[#1e2130] p-4" style={{ border: "1px solid #e5e7eb" }}>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-3">Your Streams</p>
        {streams.length === 0 && !showAddStream ? (
          <div className="text-center py-6">
            <p className="text-[13px] text-[#374151] dark:text-[#e5e7eb]">No revenue streams added yet.</p>
            <p className="text-[12px] text-[#9ca3af] mt-1 mb-3">Add the parts of your business you want to track.</p>
            <button onClick={() => setShowAddStream(true)} className="text-[12px] font-medium text-[#111827] dark:text-[#f9fafb] border border-[#e5e7eb] dark:border-[#2d3148] px-3 py-1.5 hover:bg-[#fafafa] dark:hover:bg-[#252836] transition">
              + Add Stream
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {streams.map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 py-2.5 text-[13px]" style={{ borderBottom: "1px solid #f5f5f5" }}>
                  <span className="font-medium text-[#111827] dark:text-[#f9fafb] flex-1">{s.name}</span>
                  <span className="text-[#9ca3af]">{s.type}</span>
                  <span className="font-medium text-[#111827] dark:text-[#f9fafb]" style={{ fontVariantNumeric: "tabular-nums" }}>${s.monthlyRevenue.toLocaleString()}/mo</span>
                  <button onClick={() => setStreams(prev => prev.filter(x => x.id !== s.id))} className="text-[#9ca3af] hover:text-[#dc2626]">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {!showAddStream && (
              <button onClick={() => setShowAddStream(true)} className="text-[11px] text-[#6366f1] font-medium mt-3">
                + Add Stream
              </button>
            )}
          </>
        )}
        {showAddStream && (
          <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid #f5f5f5" }}>
            <div className="flex gap-2">
              <input
                className="flex-1 text-[13px] border border-[#e5e7eb] dark:border-[#2d3148] bg-transparent dark:text-[#f9fafb] px-3 py-1.5 outline-none focus:border-[#111827]"
                placeholder="Stream name"
                value={newStream.name}
                onChange={e => setNewStream(prev => ({ ...prev, name: e.target.value }))}
              />
              <select
                className="text-[13px] border border-[#e5e7eb] dark:border-[#2d3148] bg-transparent dark:text-[#f9fafb] px-2 py-1.5 outline-none"
                value={newStream.type}
                onChange={e => setNewStream(prev => ({ ...prev, type: e.target.value }))}
              >
                {STREAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                className="w-24 text-[13px] border border-[#e5e7eb] dark:border-[#2d3148] bg-transparent dark:text-[#f9fafb] px-3 py-1.5 outline-none focus:border-[#111827]"
                placeholder="$/mo"
                type="number"
                value={newStream.monthlyRevenue || ""}
                onChange={e => setNewStream(prev => ({ ...prev, monthlyRevenue: Number(e.target.value) }))}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={addStream} className="text-[12px] font-medium bg-[#111827] dark:bg-[#f9fafb] text-white dark:text-[#111827] px-3 py-1.5">Add</button>
              <button onClick={() => setShowAddStream(false)} className="text-[12px] text-[#9ca3af] px-3 py-1.5">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Ideas Bank */}
      <div className="bg-white dark:bg-[#1e2130] p-4" style={{ border: "1px solid #e5e7eb" }}>
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-3">Ideas Bank</p>
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 text-[13px] border border-[#e5e7eb] dark:border-[#2d3148] rounded-md bg-transparent dark:text-[#f9fafb] px-3 py-2 outline-none focus:border-[#111827] dark:focus:border-[#f9fafb] dark:placeholder-[#6b7280]"
            placeholder="Drop an idea..."
            value={newIdea}
            onChange={e => setNewIdea(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addIdea()}
          />
          <button onClick={addIdea} className="text-[13px] font-medium bg-[#111827] dark:bg-[#f9fafb] text-white dark:text-[#111827] px-3 py-2">+</button>
        </div>
        <div className="flex items-center gap-3 mb-3">
          {CONTENT_TYPES.map(ct => (
            <button
              key={ct}
              onClick={() => setIdeaFilter(ct)}
              className={`text-[11px] transition ${ideaFilter === ct ? "text-[#111827] dark:text-[#f9fafb] font-medium" : "text-[#9ca3af]"}`}
            >
              {ct}
            </button>
          ))}
        </div>
        <div className="space-y-0">
          {filteredIdeas.map(idea => (
            <div key={idea.id} className="group flex items-center gap-3 py-2.5 -mx-4 px-4 hover:bg-[#fafafa] dark:hover:bg-[#252836] transition" style={{ borderBottom: "1px solid #f5f5f5" }}>
              <span className="text-[13px] text-[#111827] dark:text-[#f9fafb] flex-1">{idea.text}</span>
              {idea.contentType && <span className="text-[10px] text-[#9ca3af]">{idea.contentType}</span>}
              {idea.platform && <span className="text-[10px] text-[#9ca3af]">{idea.platform}</span>}
              <span className="text-[10px] text-[#9ca3af]">{idea.date}</span>
              <div className="hidden group-hover:flex items-center gap-2">
                <button className="text-[11px] text-[#6366f1]">Promote to Content</button>
                <button onClick={() => setIdeas(prev => prev.filter(x => x.id !== idea.id))} className="text-[11px] text-[#9ca3af]">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Plan */}
      <div className="bg-white dark:bg-[#1e2130] p-4" style={{ border: "1px solid #e5e7eb" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af]">Content Plan</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPlanView("kanban")}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] transition ${planView === "kanban" ? "text-[#111827] dark:text-[#f9fafb] font-medium" : "text-[#9ca3af]"}`}
              >
                <LayoutGrid className="w-3 h-3" /> Kanban
              </button>
              <button
                onClick={() => setPlanView("calendar")}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] transition ${planView === "calendar" ? "text-[#111827] dark:text-[#f9fafb] font-medium" : "text-[#9ca3af]"}`}
              >
                <Calendar className="w-3 h-3" /> Calendar
              </button>
            </div>
            <button onClick={() => setShowContentPanel(true)} className="text-[11px] font-medium text-[#6366f1]">+ New Content</button>
          </div>
        </div>

        {planView === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0" style={{ border: "1px solid #e5e7eb" }}>
            {Object.entries(STATUS_MAP).map(([statusId, info], ci) => {
              const items = MOCK_CONTENT.filter(c => c.status === statusId);
              return (
                <div key={statusId} className="p-3 min-h-[200px]" style={{ borderRight: ci < 3 ? "1px solid #e5e7eb" : "none" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
                    <span className="text-[12px] font-semibold text-[#111827] dark:text-[#f9fafb]">{info.label}</span>
                    <span className="text-[10px] text-[#9ca3af] ml-auto">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="p-3" style={{ border: "1px solid #f0f0f0", background: "white" }}>
                        <p className="text-[12px] font-medium text-[#111827] dark:text-[#f9fafb] mb-1">{item.title}</p>
                        <div className="flex items-center gap-1.5">
                          {item.platforms.map(p => (
                            <div key={p} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] || "#6b7280" }} title={p} />
                          ))}
                        </div>
                        {item.date && <p className="text-[10px] text-[#9ca3af] mt-1">{item.date}</p>}
                      </div>
                    ))}
                    <button className="w-full text-[11px] text-[#9ca3af] py-2 border border-dashed border-[#e5e7eb] hover:text-[#374151] transition">
                      + Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-[#9ca3af]">
            <Calendar className="w-6 h-6 mx-auto mb-2 opacity-40" />
            <p className="text-[12px]">Calendar view coming soon</p>
          </div>
        )}
      </div>

      {/* Content Creation Panel */}
      <Sheet open={showContentPanel} onOpenChange={setShowContentPanel}>
        <SheetContent side="right" className="w-[380px] p-0 border-l border-[#e5e7eb] dark:border-[#2d3148] shadow-none rounded-none">
          <div className="h-full flex flex-col">
            <SheetHeader className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
              <SheetTitle className="text-[15px] font-semibold text-[#111827] dark:text-[#f9fafb]">New Content</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-auto px-5 py-4 space-y-5">
              <input
                className="w-full text-[15px] font-medium bg-transparent border-0 border-b border-[#e5e7eb] dark:border-[#2d3148] outline-none pb-2 text-[#111827] dark:text-[#f9fafb] dark:placeholder-[#6b7280]"
                placeholder="Give this a title..."
              />
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-2">Platforms</p>
                <div className="flex gap-1.5">
                  {Object.entries(PLATFORM_COLORS).map(([p, color]) => (
                    <button key={p} className="w-7 h-7 rounded flex items-center justify-center bg-[#f5f5f5] dark:bg-[#252836] hover:opacity-80 transition" title={p}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-2">Content Type</p>
                <select className="w-full text-[13px] border border-[#e5e7eb] dark:border-[#2d3148] bg-transparent dark:text-[#f9fafb] px-3 py-2 outline-none">
                  {["Reel", "Post", "Video", "Carousel", "Story", "Tweet", "Pin", "Article"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-2">Caption</p>
                <textarea
                  className="w-full text-[13px] border border-[#e5e7eb] dark:border-[#2d3148] rounded-md bg-transparent dark:text-[#f9fafb] px-3 py-2.5 outline-none resize-none dark:placeholder-[#6b7280]"
                  placeholder="Write your caption..."
                  rows={4}
                />
                <button className="text-[11px] text-[#6366f1] font-medium mt-1">Write with AI</button>
              </div>
              <div>
                <button className="text-[11px] text-[#6366f1] font-medium">Generate Hashtags</button>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-2">Media</p>
                <div className="border border-dashed border-[#e5e7eb] dark:border-[#2d3148] rounded-md py-5 text-center">
                  <p className="text-[12px] text-[#9ca3af]">Drop media here or click to upload</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-2">Schedule</p>
                <input type="datetime-local" className="w-full text-[13px] border border-[#e5e7eb] dark:border-[#2d3148] bg-transparent dark:text-[#f9fafb] px-3 py-2 outline-none" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-2">Status</p>
                <div className="flex gap-4">
                  {["Idea", "In Progress", "Scheduled"].map(s => (
                    <label key={s} className="flex items-center gap-1.5 text-[13px] text-[#374151] dark:text-[#e5e7eb] cursor-pointer">
                      <input type="radio" name="status" className="accent-[#111827]" /> {s}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-2">Notes</p>
                <textarea
                  className="w-full text-[13px] border border-[#e5e7eb] dark:border-[#2d3148] rounded-md bg-transparent dark:text-[#f9fafb] px-3 py-2 outline-none resize-none dark:placeholder-[#6b7280]"
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>
            </div>
            <div className="shrink-0 flex gap-2 px-5 py-4" style={{ borderTop: "1px solid #e5e7eb" }}>
              <button className="flex-1 text-[12px] font-medium border border-[#e5e7eb] dark:border-[#2d3148] text-[#374151] dark:text-[#e5e7eb] py-2">Save as Draft</button>
              <button className="flex-1 text-[12px] font-medium bg-[#111827] dark:bg-[#f9fafb] text-white dark:text-[#111827] py-2">Add to Plan</button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
