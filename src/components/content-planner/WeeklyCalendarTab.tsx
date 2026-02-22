import { useState } from "react";
import { format, parseISO, addDays } from "date-fns";
import { SetupData, WeekData, PostEntry, getStatusColor, getPlatformColor, DAY_COLUMN_TINTS } from "./types";
import { ChevronLeft, ChevronRight, Plus, Camera } from "lucide-react";
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
              className="px-4 py-3 flex flex-col"
              style={{ background: DAY_COLUMN_TINTS[dayIdx], borderBottom: "1px solid #F0F0F0" }}
            >
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{DOW[dayIdx]}</span>
              <span className="text-[28px] font-bold text-gray-800 leading-tight">{format(parseISO(day.date), "d")}</span>
            </div>

            {/* Posts */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {day.posts.map(post => {
                const imgSrc = post.imageFile || post.imageUrl;
                return (
                  <div
                    key={post.id}
                    className="bg-white hover:shadow-md transition-all duration-150 cursor-pointer group relative overflow-hidden"
                    style={{ border: "1px solid #EBEBEB", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                    onClick={() => setModalPost({ dayIdx, postId: post.id })}
                  >
                    {/* Image — full width, tall */}
                    {imgSrc ? (
                      <img src={imgSrc} alt="" className="w-full object-cover" style={{ minHeight: 140, maxHeight: 180, borderRadius: "12px 12px 0 0" }} />
                    ) : (
                      <div
                        className="w-full flex flex-col items-center justify-center text-gray-300"
                        style={{ minHeight: 140, background: "#FAFAFA", border: "2px dashed #E5E7EB", borderRadius: "10px 10px 0 0" }}
                      >
                        <Camera size={22} className="mb-1" />
                        <span className="text-[11px]">Add Image</span>
                      </div>
                    )}
                    {/* Metadata below image */}
                    <div className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {post.platform && (
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 text-white"
                            style={{ background: getPlatformColor(setup.platforms, post.platform), borderRadius: 6 }}
                          >
                            {post.platform}
                          </span>
                        )}
                        <span
                          className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5"
                          style={{ background: getStatusColor(setup.statuses, post.status), color: "#374151", borderRadius: 6 }}
                        >
                          {post.status}
                        </span>
                      </div>
                      <div className="text-[13px] font-medium text-gray-800 truncate mt-1.5">
                        {post.title || "Untitled"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add post button */}
            <button
              onClick={() => addPost(dayIdx)}
              className="w-full py-2.5 text-[12px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 transition-all duration-150 hover:-translate-y-px"
              style={{ borderTop: "1px solid #F0F0F0" }}
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
