import { useState } from "react";
import { format, parseISO, addDays } from "date-fns";
import { SetupData, WeekData, PostEntry, getStatusColor, getPlatformColor, DAY_COLUMN_TINTS } from "./types";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import AutoTextarea from "./AutoTextarea";
import PostDetailModal from "./PostDetailModal";

interface Props {
  setup: SetupData;
  week: WeekData;
  weekStart: string;
  setWeek: (fn: WeekData | ((prev: WeekData) => WeekData)) => void;
  navigateWeek: (dir: -1 | 1) => void;
  addPost: (dayIndex: number) => void;
  updatePost: (dayIndex: number, postId: string, patch: Partial<PostEntry>) => void;
  deletePost: (dayIndex: number, postId: string) => void;
  updatePostChecklist: (dayIndex: number, postId: string, key: string, val: boolean) => void;
  updatePostAnalytics: (dayIndex: number, postId: string, key: string, val: string) => void;
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CHECKLIST_KEYS = ["script", "graphics", "filmed", "edited", "posted"] as const;

// ─── Post Card (16:9 image-first) ─────────────────────────────────────────
function PostCard({ post, setup, onClick }: { post: PostEntry; setup: SetupData; onClick: () => void }) {
  const checkCount = CHECKLIST_KEYS.filter(k => post.checklist[k]).length;
  const totalChecks = CHECKLIST_KEYS.length;

  return (
    <div
      onClick={onClick}
      className="overflow-hidden cursor-pointer bg-white transition-all duration-150"
      style={{
        borderRadius: 12, border: "1px solid #F0F0F0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 8,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.10)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
    >
      {/* 16:9 Image — uploaded image takes priority, then link thumbnail */}
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
        {/* Green progress bar overlay */}
        {checkCount > 0 && (
          <div className="absolute bottom-0 left-0 right-0" style={{ height: 3, background: "rgba(0,0,0,0.1)" }}>
            <div style={{ height: "100%", width: `${(checkCount / totalChecks) * 100}%`, background: "#2ECC71", transition: "width 0.3s ease" }} />
          </div>
        )}
      </div>

      {/* Metadata */}
      <div style={{ padding: "8px 10px" }}>
        <div className="flex gap-1.5 mb-1 flex-wrap">
          {post.platform && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ background: getPlatformColor(setup.platforms, post.platform), borderRadius: 20, padding: "2px 8px" }}
            >
              {post.platform}
            </span>
          )}
          {post.status && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: getStatusColor(setup.statuses, post.status), borderRadius: 20, padding: "2px 8px", color: "#374151" }}
            >
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
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export default function WeeklyCalendarTab({
  setup, week, weekStart, setWeek, navigateWeek,
  addPost, updatePost, deletePost, updatePostChecklist, updatePostAnalytics,
}: Props) {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);
  const [modalPost, setModalPost] = useState<{ dayIdx: number; postId: string } | null>(null);

  const activePost = modalPost
    ? week.days[modalPost.dayIdx]?.posts.find(p => p.id === modalPost.postId)
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid #F0F0F0" }}>
        <button onClick={() => navigateWeek(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-150">
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
        <span className="text-[13px] font-semibold text-gray-800">
          {format(start, "MMM d")} — {format(end, "MMM d, yyyy")}
        </span>
        <button onClick={() => navigateWeek(1)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-150">
          <ChevronRight size={16} className="text-gray-500" />
        </button>
        <div className="ml-auto flex items-center gap-3 text-[12px] text-gray-500">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-400">Goal:</span>
          <input
            className="bg-transparent outline-none text-gray-700 border-b border-transparent focus:border-gray-300 w-48 text-[13px]"
            value={week.weeklyGoal}
            onChange={e => setWeek(p => ({ ...p, weeklyGoal: e.target.value }))}
            placeholder="Set a weekly goal..."
          />
          <span className="text-gray-300">|</span>
          <span className="text-[13px] font-medium">{week.days.reduce((n, d) => n + d.posts.length, 0)} posts</span>
        </div>
      </div>

      {/* 7-column grid */}
      <div className="grid grid-cols-7 flex-1 min-h-0">
        {week.days.map((day, dayIdx) => (
          <div key={dayIdx} className="flex flex-col min-h-0" style={{ borderRight: dayIdx < 6 ? "1px solid #F0F0F0" : "none" }}>
            {/* Day header */}
            <div
              className="text-center"
              style={{ background: DAY_COLUMN_TINTS[dayIdx], borderBottom: "1px solid #F0F0F0", padding: "6px 12px" }}
            >
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{DOW[dayIdx]}</div>
              <div className="text-[18px] font-bold text-gray-800 leading-tight">{format(parseISO(day.date), "d")}</div>
            </div>

            {/* Posts */}
            <div className="flex-1 overflow-y-auto p-2">
              {day.posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  setup={setup}
                  onClick={() => setModalPost({ dayIdx, postId: post.id })}
                />
              ))}
            </div>

            {/* Add post */}
            <button
              onClick={() => addPost(dayIdx)}
              className="mx-2 mb-2 py-1.5 text-[12px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 transition-all duration-150 cursor-pointer"
              style={{ border: "1px dashed #DDD", borderRadius: 8, background: "none" }}
            >
              <Plus size={12} /> Add Post
            </button>
          </div>
        ))}
      </div>

      {/* Weekly review sections */}
      <div className="grid grid-cols-2 gap-0" style={{ borderTop: "1px solid #F0F0F0" }}>
        <div className="p-5" style={{ background: "#FAFAFA", borderRight: "1px solid #F0F0F0", borderLeft: "3px solid #CCE5FF", borderRadius: "0 0 0 12px" }}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Weekly To-Do</div>
          <div className="space-y-1">
            {week.weeklyTodos.map((t, i) => (
              <input
                key={i}
                className="block w-full bg-transparent py-1.5 text-[13px] outline-none text-gray-700 transition-all duration-150 hover:bg-white/50 px-2 rounded-lg"
                value={t}
                onChange={e => setWeek(p => {
                  const todos = [...p.weeklyTodos];
                  todos[i] = e.target.value;
                  return { ...p, weeklyTodos: todos };
                })}
                placeholder={`To-do ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="p-5" style={{ background: "#FAFAFA", borderLeft: "3px solid #E8D5FF", borderRadius: "0 0 12px 0" }}>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Weekly Review</div>
          <AutoTextarea
            className="w-full bg-transparent text-[13px] outline-none text-gray-700 transition-all duration-150 hover:bg-white/50 px-2 py-1 rounded-lg"
            value={week.weeklyReview}
            onChange={e => setWeek(p => ({ ...p, weeklyReview: e.target.value }))}
            placeholder="Notes on the week..."
          />
        </div>
      </div>

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
