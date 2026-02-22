import { useState } from "react";
import { format, parseISO, addDays } from "date-fns";
import { SetupData, WeekData, PostEntry, getStatusColor, getPlatformColor, DAY_COLUMN_TINTS } from "./types";
import { ChevronLeft, ChevronRight, Plus, Maximize2 } from "lucide-react";
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
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100">
        <button onClick={() => navigateWeek(-1)} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-800">
          {format(start, "MMM d")} — {format(end, "MMM d, yyyy")}
        </span>
        <button onClick={() => navigateWeek(1)} className="p-1.5 rounded hover:bg-gray-100 transition-colors">
          <ChevronRight size={16} className="text-gray-500" />
        </button>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          <span className="font-medium">Goal:</span>
          <input
            className="bg-transparent outline-none text-gray-700 border-b border-transparent focus:border-gray-300 w-48"
            value={week.weeklyGoal}
            onChange={e => setWeek(p => ({ ...p, weeklyGoal: e.target.value }))}
            placeholder="Set a weekly goal..."
          />
          <span className="text-gray-400">|</span>
          <span>{week.days.reduce((n, d) => n + d.posts.length, 0)} posts</span>
        </div>
      </div>

      {/* 7-column grid */}
      <div className="grid grid-cols-7 flex-1 min-h-0">
        {week.days.map((day, dayIdx) => (
          <div key={dayIdx} className="border-r border-gray-100 last:border-r-0 flex flex-col min-h-0">
            {/* Day header */}
            <div
              className="px-2 py-2 border-b border-gray-100 flex items-center justify-between"
              style={{ background: DAY_COLUMN_TINTS[dayIdx] }}
            >
              <div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase">{DOW[dayIdx]}</span>
                <span className="ml-1.5 text-sm font-bold text-gray-800">{format(parseISO(day.date), "d")}</span>
              </div>
            </div>

            {/* Posts */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
              {day.posts.map(post => {
                const imgSrc = post.imageFile || post.imageUrl;
                return (
                  <div
                    key={post.id}
                    className="border border-gray-100 rounded-md p-1.5 bg-white hover:shadow-sm transition-shadow cursor-pointer group relative"
                    onClick={() => setModalPost({ dayIdx, postId: post.id })}
                  >
                    <div className="flex items-start gap-1.5">
                      {/* Thumbnail */}
                      {imgSrc ? (
                        <img src={imgSrc} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-50 shrink-0 flex items-center justify-center text-gray-300 text-[10px]">
                          IMG
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-gray-800 truncate">
                          {post.title || "Untitled"}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {post.platform && (
                            <span
                              className="text-[9px] font-semibold px-1.5 py-px rounded-full text-white"
                              style={{ background: getPlatformColor(setup.platforms, post.platform) }}
                            >
                              {post.platform}
                            </span>
                          )}
                          <span
                            className="text-[9px] font-medium px-1.5 py-px rounded-full"
                            style={{ background: getStatusColor(setup.statuses, post.status), color: "#374151" }}
                          >
                            {post.status}
                          </span>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 transition-opacity">
                        <Maximize2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add post button */}
            <button
              onClick={() => addPost(dayIdx)}
              className="w-full py-1.5 text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 border-t border-gray-100 transition-colors"
            >
              <Plus size={10} /> Add Post
            </button>
          </div>
        ))}
      </div>

      {/* Weekly review */}
      <div className="grid grid-cols-2 gap-0 border-t border-gray-100">
        <div className="border-r border-gray-100 p-3">
          <div className="text-[10px] font-semibold uppercase text-gray-400 mb-1">Weekly To-Do</div>
          {week.weeklyTodos.map((t, i) => (
            <input
              key={i}
              className="block w-full bg-transparent py-0.5 text-xs outline-none text-gray-700"
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
        <div className="p-3">
          <div className="text-[10px] font-semibold uppercase text-gray-400 mb-1">Weekly Review</div>
          <AutoTextarea
            className="w-full bg-transparent text-xs outline-none text-gray-700"
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
