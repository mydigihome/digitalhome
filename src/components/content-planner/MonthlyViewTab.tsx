import { useState, useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  format, isSameMonth, addMonths, subMonths, parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SetupData, PostEntry, getStatusColor } from "./types";

interface Props {
  setup: SetupData;
  getAllPosts: () => { date: string; post: PostEntry }[];
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthlyViewTab({ setup, getAllPosts }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
    const map: Record<string, { date: string; post: PostEntry }[]> = {};
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
      <div className="w-40 shrink-0 border-r border-gray-200 p-3">
        <div className="text-[10px] font-semibold uppercase text-gray-400 mb-3">Platform Distribution</div>
        {Object.entries(platformCounts).map(([platform, count]) => (
          <div key={platform} className="mb-2">
            <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
              <span>{platform}</span><span>{count}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-400 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
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
        <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-200">
          <button onClick={() => setCurrentMonth(p => subMonths(p, 1))} className="p-1 rounded hover:bg-gray-100">
            <ChevronLeft size={14} className="text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-gray-800">{format(currentMonth, "MMMM yyyy")}</span>
          <button onClick={() => setCurrentMonth(p => addMonths(p, 1))} className="p-1 rounded hover:bg-gray-100">
            <ChevronRight size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {DOW.map(d => (
            <div key={d} className="px-2 py-1.5 text-[10px] font-semibold uppercase text-gray-400 text-center border-r border-gray-200 last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto">
          {Array.from({ length: calendarDays.length / 7 }).map((_, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 border-b border-gray-200">
              {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, di) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const entries = postsByDate[dateStr] || [];
                const inMonth = isSameMonth(day, currentMonth);
                return (
                  <div
                    key={di}
                    className="border-r border-gray-200 last:border-r-0 min-h-[100px] p-1.5"
                    style={{ opacity: inMonth ? 1 : 0.4 }}
                  >
                    <div className="text-[11px] font-medium text-gray-500 mb-1">{format(day, "d")}</div>
                    <div className="space-y-1">
                      {entries.slice(0, 10).map(({ post }) => {
                        const imgSrc = post.imageFile || post.imageUrl;
                        return (
                          <div key={post.id} className="flex items-start gap-1">
                            {imgSrc ? (
                              <img src={imgSrc} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded bg-gray-100 shrink-0" />
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
                                <span className="text-[8px] text-gray-400">{post.platform}</span>
                              )}
                            </div>
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
    </div>
  );
}
