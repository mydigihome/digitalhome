import { useState, useRef, useEffect } from "react";
import { format, parseISO, addDays, getWeek } from "date-fns";
import { SetupData, WeekData, PostEntry, IdeasTable, getStatusColor, getPlatformColor, DAY_COLUMN_TINTS } from "./types";
import { ChevronLeft, ChevronRight, Plus, PanelRightOpen, PanelRightClose, X, FileText, Newspaper, Search } from "lucide-react";
import AutoTextarea from "./AutoTextarea";
import PostDetailModal from "./PostDetailModal";

interface Props {
  setup: SetupData;
  week: WeekData;
  weekStart: string;
  setWeek: (fn: WeekData | ((prev: WeekData) => WeekData)) => void;
  navigateWeek: (dir: -1 | 1) => void;
  addPost: (dayIndex: number, contentType?: string) => void;
  updatePost: (dayIndex: number, postId: string, patch: Partial<PostEntry>) => void;
  deletePost: (dayIndex: number, postId: string) => void;
  movePost: (fromDay: number, toDay: number, postId: string) => void;
  updatePostChecklist: (dayIndex: number, postId: string, key: string, val: boolean) => void;
  updatePostAnalytics: (dayIndex: number, postId: string, key: string, val: string) => void;
  ideasTables: IdeasTable[];
  setIdeasTables: (fn: IdeasTable[] | ((prev: IdeasTable[]) => IdeasTable[])) => void;
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CHECKLIST_KEYS = ["script", "graphics", "filmed", "edited", "posted"] as const;

// ─── Post Card ────────────────────────
function PostCard({
  post, setup, dateLabel, dayIdx, onClick,
}: {
  post: PostEntry; setup: SetupData; dateLabel: string; dayIdx: number; onClick: () => void;
}) {
  const checkCount = CHECKLIST_KEYS.filter(k => post.checklist[k]).length;
  const totalChecks = CHECKLIST_KEYS.length;

  const isText = post.contentType === "Text";
  const isArticle = post.contentType === "Article";
  const hasImage = !!(post.imageFile || post.imageUrl);

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData("application/post-id", post.id);
        e.dataTransfer.setData("application/from-day", String(dayIdx));
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={onClick}
      className="overflow-hidden cursor-grab active:cursor-grabbing bg-white transition-all duration-150"
      style={{
        borderRadius: 12, border: "1px solid #F0F0F0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 8,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
    >
      {/* ── Text-only card ── */}
      {isText && !hasImage ? (
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <FileText size={12} className="text-blue-400" />
            <span className="text-[10px] font-medium text-gray-400">{dateLabel}</span>
          </div>
          <div className="text-[13px] font-medium text-gray-800 leading-snug mb-2" style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
            {post.caption || post.title || <span className="text-gray-300 italic">Write your text...</span>}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {post.platform && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white" style={{ background: getPlatformColor(setup.platforms, post.platform), borderRadius: 20, padding: "2px 8px" }}>
                {post.platform}
              </span>
            )}
            {post.status && (
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ background: getStatusColor(setup.statuses, post.status), borderRadius: 20, padding: "2px 8px", color: "#374151" }}>
                {post.status}
              </span>
            )}
          </div>
          {checkCount > 0 && (
            <div className="mt-2" style={{ height: 3, background: "rgba(0,0,0,0.06)", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${(checkCount / totalChecks) * 100}%`, background: "#2ECC71", borderRadius: 2, transition: "width 0.3s ease" }} />
            </div>
          )}
        </div>

      /* ── Article card ── */
      ) : isArticle ? (
        <div>
          <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
            <Newspaper size={12} className="text-orange-400" />
            <span className="text-[10px] font-medium text-gray-400">{dateLabel}</span>
          </div>
          {hasImage && (
            <div className="mx-3 rounded-lg overflow-hidden" style={{ aspectRatio: "2/1", background: "#F4F4F4" }}>
              <img src={post.imageFile || post.imageUrl} alt="" className="w-full h-full object-cover block" />
            </div>
          )}
          <div className="p-3 pt-2" style={{ borderLeft: "3px solid #F59E0B" }}>
            <div className="text-[13px] font-bold text-gray-900 leading-snug mb-1" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
              {post.title || <span className="text-gray-300">Article headline...</span>}
            </div>
            <div className="text-[11px] text-gray-500 leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
              {post.caption || <span className="text-gray-300 italic">Add a summary...</span>}
            </div>
          </div>
          <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
            {post.platform && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white" style={{ background: getPlatformColor(setup.platforms, post.platform), borderRadius: 20, padding: "2px 8px" }}>
                {post.platform}
              </span>
            )}
            {post.status && (
              <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ background: getStatusColor(setup.statuses, post.status), borderRadius: 20, padding: "2px 8px", color: "#374151" }}>
                {post.status}
              </span>
            )}
          </div>
          {checkCount > 0 && (
            <div className="mx-3 mb-2" style={{ height: 3, background: "rgba(0,0,0,0.06)", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${(checkCount / totalChecks) * 100}%`, background: "#2ECC71", borderRadius: 2, transition: "width 0.3s ease" }} />
            </div>
          )}
          {post.postLink && (
            <div className="text-[10px] text-gray-400 px-3 pb-2 truncate">
              🔗 {post.postLink.replace(/^https?:\/\/(www\.)?/, "").substring(0, 30)}…
            </div>
          )}
        </div>

      /* ── Default (visual/image) card ── */
      ) : (
        <>
          <div className="px-2.5 pt-1.5 pb-0.5">
            <span className="text-[10px] font-medium text-gray-400">{dateLabel}</span>
          </div>
          <div className="w-full relative" style={{ aspectRatio: "16/9", background: "#F4F4F4" }}>
            {post.imageFile ? (
              <img src={post.imageFile} alt="" className="w-full h-full object-cover block" />
            ) : post.imageUrl ? (
              <img src={post.imageUrl} alt="" className="w-full h-full object-cover block" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300" style={{ border: "2px dashed #E8E8E8" }}>
                <div className="text-[24px]">📷</div>
                <div className="text-[11px] mt-1">Add Image</div>
              </div>
            )}
            {checkCount > 0 && (
              <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, background: "rgba(0,0,0,0.1)" }}>
                <div style={{ height: "100%", width: `${(checkCount / totalChecks) * 100}%`, background: "#2ECC71", transition: "width 0.3s ease" }} />
              </div>
            )}
          </div>
          <div style={{ padding: "8px 10px" }}>
            <div className="flex gap-1.5 mb-1 flex-wrap">
              {post.platform && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white" style={{ background: getPlatformColor(setup.platforms, post.platform), borderRadius: 20, padding: "2px 8px" }}>
                  {post.platform}
                </span>
              )}
              {post.status && (
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ background: getStatusColor(setup.statuses, post.status), borderRadius: 20, padding: "2px 8px", color: "#374151" }}>
                  {post.status}
                </span>
              )}
            </div>
            <div className="text-[12px] font-medium text-gray-800 overflow-hidden" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const }}>
              {post.title || <span className="text-gray-300">Untitled</span>}
            </div>
            {post.postLink && (
              <div className="text-[10px] text-gray-400 mt-1 truncate">
                🔗 {post.postLink.replace(/^https?:\/\/(www\.)?/, "").substring(0, 30)}…
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Compact Ideas Bank Sidebar ────────────────────────
function IdeasSidebar({ ideasTables }: { ideasTables: IdeasTable[] }) {
  return (
    <div className="overflow-y-auto h-full p-3 space-y-4">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-1">Ideas Bank</h3>
      {ideasTables.map(table => (
        <div key={table.id}>
          <p className="text-[12px] font-semibold text-gray-700 mb-2 px-1">{table.title}</p>
          {(table.pillars || []).map(pillar => {
            const ideas = table.ideas[pillar] || [];
            if (ideas.length === 0) return null;
            return (
              <div key={pillar} className="mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1 mb-1">{pillar}</p>
                {ideas.map(idea => (
                  <div
                    key={idea.id}
                    className="text-[11px] text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-default leading-tight"
                  >
                    {idea.text || <span className="text-gray-300 italic">Empty</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Add Post Dropdown ────────────────────────
function AddPostDropdown({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative mx-2 mb-2">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full py-1.5 text-[12px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer"
        style={{ border: "1px dashed #DDD", borderRadius: 8, background: "none" }}
      >
        <Plus size={12} /> Add Post
      </button>
      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
          <button
            onClick={() => { onAdd("Text"); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <FileText size={14} className="text-gray-400" /> Text
          </button>
          <button
            onClick={() => { onAdd("Article"); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Newspaper size={14} className="text-gray-400" /> Article
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function WeeklyCalendarTab({
  setup, week, weekStart, setWeek, navigateWeek,
  addPost, updatePost, deletePost, movePost, updatePostChecklist, updatePostAnalytics,
  ideasTables, setIdeasTables,
}: Props) {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);
  const [modalPost, setModalPost] = useState<{ dayIdx: number; postId: string } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [ideasOpen, setIdeasOpen] = useState(false);

  const activePost = modalPost
    ? week.days[modalPost.dayIdx]?.posts.find(p => p.id === modalPost.postId)
    : null;

  const handleDrop = (e: React.DragEvent, toDayIdx: number) => {
    e.preventDefault();
    setDragOverDay(null);
    const postId = e.dataTransfer.getData("application/post-id");
    const fromDay = parseInt(e.dataTransfer.getData("application/from-day"), 10);
    if (postId && !isNaN(fromDay)) {
      movePost(fromDay, toDayIdx, postId);
    }
  };

  const handleDragOver = (e: React.DragEvent, dayIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDay(dayIdx);
  };

  return (
    <div className="flex h-full">
      {/* Main calendar area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Week header – Stitch style */}
        <div className="px-6 pt-5 pb-3" style={{ borderBottom: "1px solid #F0F0F0" }}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-[28px] font-bold leading-tight" style={{ color: "#1A1A2E", letterSpacing: "-0.02em" }}>
                Weekly Planner
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
                {format(start, "MMMM d")} – {format(end, "d, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-gray-50 transition-colors" style={{ border: "1px solid #E5E7EB" }}>
                <Search size={16} style={{ color: "#6B7280" }} />
              </button>
              <button
                onClick={() => addPost(0)}
                className="px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-all hover:opacity-90 flex items-center gap-1.5"
                style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
              >
                <Plus size={14} /> New Idea
              </button>
            </div>
          </div>
        </div>

        {/* 7-column grid */}
        <div className="grid grid-cols-7 flex-1 min-h-0">
          {week.days.map((day, dayIdx) => (
            <div
              key={dayIdx}
              className="flex flex-col min-h-0 transition-colors duration-150"
              style={{
                borderRight: dayIdx < 6 ? "1px solid #F0F0F0" : "none",
                background: dragOverDay === dayIdx ? "rgba(99,102,241,0.06)" : undefined,
              }}
              onDragOver={e => handleDragOver(e, dayIdx)}
              onDragLeave={() => setDragOverDay(null)}
              onDrop={e => handleDrop(e, dayIdx)}
            >
              {/* Day header */}
              <div className="text-center py-3 px-2" style={{ borderBottom: "1px solid #F0F0F0" }}>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>
                  {DOW[dayIdx]}
                </div>
                <div className="text-[22px] font-bold leading-tight mt-0.5" style={{ color: "#1A1A2E" }}>
                  {format(parseISO(day.date), "d")}
                </div>
              </div>

              {/* Posts */}
              <div className="flex-1 overflow-y-auto p-2">
                {day.posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    setup={setup}
                    dayIdx={dayIdx}
                    dateLabel={format(parseISO(day.date), "EEE, MMM d")}
                    onClick={() => setModalPost({ dayIdx, postId: post.id })}
                  />
                ))}

                {/* Empty state – dashed add area */}
                {day.posts.length === 0 && (
                  <div
                    className="w-full flex items-center justify-center cursor-pointer hover:bg-gray-50/50 transition-colors"
                    style={{ aspectRatio: "1/1.1", border: "1.5px dashed #D1D5DB", borderRadius: 12 }}
                    onClick={() => addPost(dayIdx)}
                  >
                    <Plus size={20} style={{ color: "#D1D5DB" }} />
                  </div>
                )}
              </div>

              {/* Add post dropdown */}
              <AddPostDropdown onAdd={(type) => addPost(dayIdx, type)} />
            </div>
          ))}
        </div>

        {/* Weekly To-Do & Review – Stitch style with colored accent bars */}
        <div className="grid grid-cols-2 gap-0" style={{ borderTop: "1px solid #F0F0F0" }}>
          <div className="p-5" style={{ borderRight: "1px solid #F0F0F0" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: "#EF4444" }} />
              <span className="text-[15px] font-bold" style={{ color: "#1A1A2E" }}>Weekly To-Do</span>
            </div>
            <div className="space-y-2">
              {week.weeklyTodos.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full shrink-0" style={{ border: "2px solid #D1D5DB" }} />
                  <input
                    className="block w-full bg-transparent py-1 text-[14px] outline-none transition-all duration-150"
                    style={{ color: "#374151" }}
                    value={t}
                    onChange={e => setWeek(p => {
                      const todos = [...p.weeklyTodos];
                      todos[i] = e.target.value;
                      return { ...p, weeklyTodos: todos };
                    })}
                    placeholder={`To-do ${i + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-5 rounded-full" style={{ background: "#EC4899" }} />
              <span className="text-[15px] font-bold" style={{ color: "#1A1A2E" }}>Weekly Review</span>
            </div>
            <AutoTextarea
              className="w-full bg-transparent text-[14px] outline-none transition-all duration-150 leading-relaxed"
              style={{ color: "#374151" }}
              value={week.weeklyReview}
              onChange={e => setWeek(p => ({ ...p, weeklyReview: e.target.value }))}
              placeholder="Start typing your creative reflection..."
            />
          </div>
        </div>

        {/* Goal & Ideas Bank toggle row */}
        <div className="flex items-center gap-3 px-6 py-2.5 text-[12px]" style={{ borderTop: "1px solid #F0F0F0", color: "#9CA3AF" }}>
          <span className="text-[11px] uppercase tracking-wider font-semibold">Goal:</span>
          <input
            className="bg-transparent outline-none border-b border-transparent focus:border-gray-300 flex-1 text-[13px]"
            style={{ color: "#374151" }}
            value={week.weeklyGoal}
            onChange={e => setWeek(p => ({ ...p, weeklyGoal: e.target.value }))}
            placeholder="Set a weekly goal..."
          />
          <span style={{ color: "#D1D5DB" }}>|</span>
          <span className="text-[13px] font-medium" style={{ color: "#374151" }}>{week.days.reduce((n, d) => n + d.posts.length, 0)} posts</span>
          <button
            onClick={() => setIdeasOpen(v => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-150 ml-1"
            title={ideasOpen ? "Close Ideas Bank" : "Open Ideas Bank"}
          >
            {ideasOpen ? <PanelRightClose size={16} className="text-gray-500" /> : <PanelRightOpen size={16} className="text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Collapsible Ideas Bank sidebar */}
      {ideasOpen && (
        <div className="w-64 shrink-0 border-l border-gray-100 bg-white">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-[12px] font-semibold text-gray-700">Ideas Bank</span>
            <button onClick={() => setIdeasOpen(false)} className="p-1 rounded hover:bg-gray-100">
              <X size={14} className="text-gray-400" />
            </button>
          </div>
          <IdeasSidebar ideasTables={ideasTables} />
        </div>
      )}

      {/* Post detail modal */}
      {activePost && modalPost && (
        <PostDetailModal
          post={activePost}
          setup={setup}
          onUpdate={patch => updatePost(modalPost.dayIdx, modalPost.postId, patch)}
          onUpdateChecklist={(k, v) => updatePostChecklist(modalPost.dayIdx, modalPost.postId, k, v)}
          onUpdateAnalytics={(k, v) => updatePostAnalytics(modalPost.dayIdx, modalPost.postId, k, v)}
          onDelete={() => deletePost(modalPost.dayIdx, modalPost.postId)}
          onClose={() => setModalPost(null)}
        />
      )}
    </div>
  );
}
