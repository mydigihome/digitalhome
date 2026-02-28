import { useState, useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  format, isSameMonth, addMonths, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { SetupData, PostEntry, getStatusColor, getPlatformColor } from "./types";
import PostDetailModal from "./PostDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  setup: SetupData;
  getAllPosts: () => { date: string; post: PostEntry; weekStart: string; dayIndex: number }[];
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthlyViewTab({ setup, getAllPosts }: Props) {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<{ date: string; post: PostEntry; weekStart: string; dayIndex: number } | null>(null);
  const [syncing, setSyncing] = useState(false);

  const syncToCalendar = async () => {
    if (!user) { toast.error("Please log in first"); return; }
    setSyncing(true);
    try {
      const monthPosts = allPosts.filter(({ date }) => {
        const d = new Date(date);
        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
      });
      if (monthPosts.length === 0) { toast.info("No posts to sync this month"); setSyncing(false); return; }

      let count = 0;
      for (const { date, post } of monthPosts) {
        const title = (post.caption || post.title || "Content Post").substring(0, 50);
        const description = `${post.caption}\n\nPlatform: ${post.platform || "N/A"}\nStatus: ${post.status || "N/A"}`;
        const startTime = new Date(date + "T10:00:00");
        const endTime = new Date(date + "T10:30:00");

        const { error } = await supabase.from("calendar_events").insert({
          user_id: user.id,
          title: `📱 ${title}`,
          description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          all_day: false,
          source: "manual",
          color: "#8B5CF6",
        });
        if (!error) count++;
      }
      toast.success(`Synced ${count} posts to Calendar`);
    } catch {
      toast.error("Failed to sync");
    }
    setSyncing(false);
  };

  const syncSinglePost = async (date: string, post: PostEntry) => {
    if (!user) { toast.error("Please log in first"); return; }
    const title = (post.caption || post.title || "Content Post").substring(0, 50);
    const description = `${post.caption}\n\nPlatform: ${post.platform || "N/A"}\nStatus: ${post.status || "N/A"}`;
    const startTime = new Date(date + "T10:00:00");
    const endTime = new Date(date + "T10:30:00");
    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title: `📱 ${title}`,
      description,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      all_day: false,
      source: "manual",
      color: "#8B5CF6",
    });
    if (error) toast.error("Failed to add to calendar");
    else toast.success("Post added to Calendar!");
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let d = calStart;
    while (d <= calEnd) { days.push(d); d = addDays(d, 1); }
    return days;
  }, [currentMonth]);

  const allPosts = getAllPosts();
  const postsByDate = useMemo(() => {
    const map: Record<string, typeof allPosts> = {};
    allPosts.forEach(entry => {
      if (!map[entry.date]) map[entry.date] = [];
      map[entry.date].push(entry);
    });
    return map;
  }, [allPosts]);

  // Platform distribution
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allPosts.forEach(({ post }) => {
      if (post.platform) counts[post.platform] = (counts[post.platform] || 0) + 1;
    });
    return counts;
  }, [allPosts]);

  const maxCount = Math.max(1, ...Object.values(platformCounts));

  return (
    <div className="flex h-full gap-0">
      {/* Left sidebar - stats */}
      <div className="w-44 shrink-0 border-r border-gray-100 p-3">
        <div className="text-[10px] font-semibold uppercase text-gray-400 mb-3">Platform Distribution</div>
        {Object.entries(platformCounts).map(([platform, count]) => (
          <div key={platform} className="mb-2.5">
            <div className="flex justify-between items-center text-[10px] text-gray-600 mb-0.5">
              <span className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ background: getPlatformColor(setup.platforms, platform) }}
                />
                {platform}
              </span>
              <span>{count}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(count / maxCount) * 100}%`, background: getPlatformColor(setup.platforms, platform) }}
              />
            </div>
          </div>
        ))}
        {Object.keys(platformCounts).length === 0 && (
          <div className="text-[10px] text-gray-400">No posts yet</div>
        )}
      </div>

      {/* Calendar */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100">
          <button onClick={() => setCurrentMonth(p => subMonths(p, 1))} className="p-1 rounded hover:bg-gray-100">
            <ChevronLeft size={14} className="text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-800">{format(currentMonth, "MMMM yyyy")}</span>
          <button onClick={() => setCurrentMonth(p => addMonths(p, 1))} className="p-1 rounded hover:bg-gray-100">
            <ChevronRight size={14} className="text-gray-500" />
          </button>
          <button
            onClick={syncToCalendar}
            disabled={syncing}
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 disabled:opacity-50"
          >
            📅 {syncing ? "Syncing..." : "Sync to Calendar"}
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DOW.map(d => (
            <div key={d} className="px-2 py-1.5 text-[10px] font-semibold uppercase text-gray-400 text-center border-r border-gray-100 last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto">
          {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 border-b border-gray-100">
              {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, di) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const entries = postsByDate[dateStr] || [];
                const inMonth = isSameMonth(day, currentMonth);
                return (
                  <div
                    key={di}
                    className="border-r border-gray-100 last:border-r-0 min-h-[100px] p-1.5"
                    style={{ opacity: inMonth ? 1 : 0.35 }}
                  >
                    <div className="text-[11px] font-semibold text-gray-500 mb-1">{format(day, "d")}</div>
                    <div className="space-y-1">
                      {entries.slice(0, 10).map(({ post, weekStart, dayIndex }) => {
                        const imgSrc = post.imageFile || post.imageUrl;
                        return (
                          <div
                            key={post.id}
                            className="flex items-start gap-1 cursor-pointer hover:bg-gray-50 rounded p-0.5 transition-colors group"
                            onClick={() => setSelectedPost({ date: dateStr, post, weekStart, dayIndex })}
                          >
                            {imgSrc ? (
                              <img src={imgSrc} alt="" className="w-7 h-7 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-7 h-7 rounded bg-gray-100 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0"
                                  style={{ background: getStatusColor(setup.statuses, post.status) }}
                                />
                                <span className="text-[9px] text-gray-700 truncate">{post.title || "Untitled"}</span>
                              </div>
                              {post.platform && (
                                <span
                                  className="text-[8px] font-semibold px-1 py-px rounded-full text-white inline-block mt-0.5"
                                  style={{ background: getPlatformColor(setup.platforms, post.platform) }}
                                >
                                  {post.platform}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); syncSinglePost(dateStr, post); }}
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
                              title="Add to Calendar"
                            >
                              <CalendarIcon size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Read-only detail modal for monthly (no update/delete since it's read from getAllPosts) */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost.post}
          setup={setup}
          onUpdate={() => {}}
          onUpdateChecklist={() => {}}
          onUpdateAnalytics={() => {}}
          onDelete={() => {}}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
