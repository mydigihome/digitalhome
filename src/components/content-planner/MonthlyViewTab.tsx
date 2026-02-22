import { useState, useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
  format, isSameMonth, addMonths, subMonths, parseISO, isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WeekData, STATUS_COLORS } from "./types";

interface Props {
  week: WeekData;
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MonthlyViewTab({ week }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days: Date[] = [];
    let d = calStart;
    while (d <= calEnd) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentMonth]);

  const dayContent = useMemo(() => {
    const map: Record<string, WeekData["days"][0]> = {};
    week.days.forEach(d => { map[d.date] = d; });
    return map;
  }, [week]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="mb-3 flex items-center gap-4">
        <button onClick={() => setCurrentMonth(p => subMonths(p, 1))} className="rounded p-1 hover:bg-[#E8E0D5]">
          <ChevronLeft size={18} color="#2C2C2C" />
        </button>
        <h2 className="text-lg font-bold" style={{ color: "#2C2C2C" }}>{format(currentMonth, "MMMM yyyy")}</h2>
        <button onClick={() => setCurrentMonth(p => addMonths(p, 1))} className="rounded p-1 hover:bg-[#E8E0D5]">
          <ChevronRight size={18} color="#2C2C2C" />
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: 700 }}>
          <thead>
            <tr>
              {DOW.map(d => (
                <th
                  key={d}
                  className="border px-2 py-2 text-center text-xs font-bold uppercase"
                  style={{ background: "#E8E0D5", color: "#2C2C2C", borderColor: "#C9B99A" }}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: calendarDays.length / 7 }).map((_, weekIdx) => (
              <tr key={weekIdx}>
                {calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, di) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const entry = dayContent[dateStr];
                  const inMonth = isSameMonth(day, currentMonth);
                  return (
                    <td
                      key={di}
                      className="border align-top"
                      style={{
                        borderColor: "#E8E0D5",
                        background: inMonth ? "#FAF7F2" : "#F3EDE4",
                        height: 90,
                        width: "14.28%",
                      }}
                    >
                      <div className="px-1.5 py-1">
                        <div className="text-xs font-semibold" style={{ color: inMonth ? "#2C2C2C" : "#C9B99A" }}>
                          {format(day, "d")}
                        </div>
                        {entry && entry.title && (
                          <div className="mt-1">
                            <div className="flex items-center gap-1">
                              <span
                                className="inline-block h-2 w-2 rounded-full shrink-0"
                                style={{ background: STATUS_COLORS[entry.status] || "#C9B99A" }}
                              />
                              <span className="truncate text-[10px] font-medium" style={{ color: "#2C2C2C" }}>{entry.title}</span>
                            </div>
                            {entry.platform && (
                              <span
                                className="mt-0.5 inline-block rounded px-1 text-[9px] font-semibold"
                                style={{ background: "#E8E0D5", color: "#2C2C2C" }}
                              >
                                {entry.platform}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
