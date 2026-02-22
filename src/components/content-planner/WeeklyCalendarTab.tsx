import { format, parseISO, addDays } from "date-fns";
import { SetupData, WeekData, PostEntry, getStatusColor } from "./types";
import { ChevronLeft, ChevronRight, Plus, X, Upload, Image } from "lucide-react";
import AutoTextarea from "./AutoTextarea";
import { useRef, useCallback, DragEvent } from "react";

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

function ImageUpload({ post, onUpdate }: { post: PostEntry; onUpdate: (patch: Partial<PostEntry>) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      onUpdate({ imageFile: e.target?.result as string, imageUrl: "" });
    };
    reader.readAsDataURL(file);
  }, [onUpdate]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: DragEvent) => { e.preventDefault(); }, []);

  const imgSrc = post.imageFile || post.imageUrl;

  if (imgSrc) {
    return (
      <div className="relative group">
        <img src={imgSrc} alt="" className="w-full h-20 object-cover rounded" />
        <button
          onClick={() => onUpdate({ imageFile: undefined, imageUrl: "" })}
          className="absolute top-1 right-1 bg-white/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={10} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="border border-dashed border-gray-300 rounded flex flex-col items-center justify-center py-3 cursor-pointer hover:bg-gray-50 transition-colors text-gray-400"
      onClick={() => fileRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Image size={16} />
      <span className="text-[10px] mt-1">Drop / Click / Paste URL</span>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <input
        className="mt-1 w-full px-2 text-[10px] bg-transparent outline-none text-center text-gray-500"
        placeholder="or paste URL..."
        onBlur={e => { if (e.target.value) onUpdate({ imageUrl: e.target.value }); }}
        onKeyDown={e => { if (e.key === "Enter") { onUpdate({ imageUrl: (e.target as HTMLInputElement).value }); } }}
      />
    </div>
  );
}

export default function WeeklyCalendarTab({
  setup, week, weekStart, setWeek, navigateWeek,
  addPost, updatePost, deletePost, updatePostChecklist, updatePostAnalytics,
}: Props) {
  const start = parseISO(weekStart);
  const end = addDays(start, 6);

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <button onClick={() => navigateWeek(-1)} className="p-1 rounded hover:bg-gray-100 transition-colors">
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {format(start, "MMM d")} — {format(end, "MMM d, yyyy")}
        </span>
        <button onClick={() => navigateWeek(1)} className="p-1 rounded hover:bg-gray-100 transition-colors">
          <ChevronRight size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Sidebar meta */}
      <div className="flex gap-4 mb-4 px-1 text-xs text-gray-500">
        <div>
          <span className="font-medium">Goal:</span>{" "}
          <input
            className="bg-transparent outline-none text-gray-700 border-b border-transparent focus:border-gray-300 w-48"
            value={week.weeklyGoal}
            onChange={e => setWeek(p => ({ ...p, weeklyGoal: e.target.value }))}
            placeholder="Set a weekly goal..."
          />
        </div>
        <div>Posts: {week.days.reduce((n, d) => n + d.posts.length, 0)}</div>
      </div>

      {/* 7-column grid */}
      <div className="grid grid-cols-7 flex-1 border-t border-l border-gray-200">
        {week.days.map((day, dayIdx) => (
          <div key={dayIdx} className="border-r border-b border-gray-200 flex flex-col min-h-0">
            {/* Day header */}
            <div className="px-2 py-1.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-gray-500 uppercase">{DOW[dayIdx]}</span>
                <span className="ml-1.5 text-xs font-semibold text-gray-800">{format(parseISO(day.date), "d")}</span>
              </div>
            </div>

            {/* Posts */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-2">
              {day.posts.map(post => (
                <div key={post.id} className="border border-gray-200 rounded-md p-2 relative group bg-white">
                  <button
                    onClick={() => deletePost(dayIdx, post.id)}
                    className="absolute top-1 right-1 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>

                  {/* Image */}
                  <ImageUpload post={post} onUpdate={patch => updatePost(dayIdx, post.id, patch)} />

                  {/* Platform + Type */}
                  <div className="flex gap-1 mt-1.5">
                    <select
                      className="flex-1 text-[10px] bg-transparent outline-none text-gray-600 border border-gray-200 rounded px-1 py-0.5"
                      value={post.platform}
                      onChange={e => updatePost(dayIdx, post.id, { platform: e.target.value })}
                    >
                      <option value="">Platform</option>
                      {setup.platforms.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select
                      className="flex-1 text-[10px] bg-transparent outline-none text-gray-600 border border-gray-200 rounded px-1 py-0.5"
                      value={post.contentType}
                      onChange={e => updatePost(dayIdx, post.id, { contentType: e.target.value })}
                    >
                      <option value="">Type</option>
                      {setup.contentFormats.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>

                  {/* Title */}
                  <AutoTextarea
                    className="w-full mt-1 text-xs font-medium bg-transparent outline-none text-gray-800 px-0"
                    value={post.title}
                    onChange={e => updatePost(dayIdx, post.id, { title: e.target.value })}
                    placeholder="Title / Hook"
                  />

                  {/* Caption */}
                  <AutoTextarea
                    className="w-full text-[11px] bg-transparent outline-none text-gray-600 px-0 leading-relaxed"
                    value={post.caption}
                    onChange={e => updatePost(dayIdx, post.id, { caption: e.target.value })}
                    placeholder="Caption..."
                  />

                  {/* Status */}
                  <div className="mt-1">
                    <span
                      className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ background: getStatusColor(setup.statuses, post.status) }}
                    >
                      <select
                        className="bg-transparent outline-none cursor-pointer text-gray-700"
                        value={post.status}
                        onChange={e => updatePost(dayIdx, post.id, { status: e.target.value })}
                      >
                        {setup.statuses.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                      </select>
                    </span>
                  </div>

                  {/* Checklist */}
                  <div className="flex flex-wrap gap-x-2 mt-1.5">
                    {CHECKLIST_KEYS.map(k => (
                      <label key={k} className="flex items-center gap-0.5 text-[9px] text-gray-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={post.checklist[k]}
                          onChange={e => updatePostChecklist(dayIdx, post.id, k, e.target.checked)}
                          className="h-2.5 w-2.5 rounded border-gray-300"
                        />
                        {k.charAt(0).toUpperCase() + k.slice(1)}
                      </label>
                    ))}
                  </div>

                  {/* Analytics */}
                  <div className="grid grid-cols-4 gap-1 mt-1.5">
                    {(["views", "likes", "comments", "shares"] as const).map(k => (
                      <div key={k} className="text-center">
                        <div className="text-[8px] uppercase text-gray-400">{k.slice(0, 1)}</div>
                        <input
                          className="w-full text-center text-[10px] bg-transparent outline-none text-gray-600 border-b border-gray-100 focus:border-gray-300"
                          value={post.analytics[k]}
                          onChange={e => updatePostAnalytics(dayIdx, post.id, k, e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add post button */}
            <button
              onClick={() => addPost(dayIdx)}
              className="w-full py-1.5 text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 border-t border-gray-200 transition-colors"
            >
              <Plus size={10} /> Add Post
            </button>
          </div>
        ))}
      </div>

      {/* Weekly review */}
      <div className="grid grid-cols-2 gap-0 border-l border-gray-200 mt-0">
        <div className="border-r border-b border-gray-200 p-3">
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
        <div className="border-b border-gray-200 p-3">
          <div className="text-[10px] font-semibold uppercase text-gray-400 mb-1">Weekly Review</div>
          <AutoTextarea
            className="w-full bg-transparent text-xs outline-none text-gray-700"
            value={week.weeklyReview}
            onChange={e => setWeek(p => ({ ...p, weeklyReview: e.target.value }))}
            placeholder="Notes on the week..."
          />
        </div>
      </div>
    </div>
  );
}
