import { useState } from "react";
import { CalendarDays, LayoutGrid, Plus, GripVertical } from "lucide-react";

type ContentPiece = {
  id: string;
  title: string;
  platforms: string[];
  status: "idea" | "in_progress" | "scheduled" | "published";
  scheduledFor?: string;
  assignee?: string;
};

const MOCK_PIECES: ContentPiece[] = [
  { id: "1", title: "Weekly Tips Reel", platforms: ["instagram"], status: "in_progress", scheduledFor: "Next Tuesday" },
  { id: "2", title: "YouTube Tutorial: Editing Tips", platforms: ["youtube"], status: "idea" },
  { id: "3", title: "Brand Partnership Post", platforms: ["instagram", "tiktok"], status: "scheduled", scheduledFor: "Friday 3pm" },
  { id: "4", title: "Behind the Scenes Vlog", platforms: ["youtube"], status: "published" },
  { id: "5", title: "Trending Audio Reel", platforms: ["tiktok", "instagram"], status: "idea" },
];

const COLUMNS = [
  { id: "idea", label: "Ideas", color: "#9ca3af" },
  { id: "in_progress", label: "In Progress", color: "#f59e0b" },
  { id: "scheduled", label: "Scheduled", color: "#6366f1" },
  { id: "published", label: "Published", color: "#16a34a" },
];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C", youtube: "#FF0000", tiktok: "#000000",
  twitter: "#1DA1F2", facebook: "#1877F2", pinterest: "#E60023", linkedin: "#0A66C2",
};

function KanbanView() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {COLUMNS.map(col => {
        const pieces = MOCK_PIECES.filter(p => p.status === col.id);
        return (
          <div key={col.id} className="bg-[#f9fafb] dark:bg-[#252836] rounded-[20px] p-4 min-h-[300px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-sm font-bold text-[#111827] dark:text-[#f9fafb]">{col.label}</span>
              </div>
              <span className="text-xs bg-white dark:bg-[#1e2130] px-2 py-0.5 rounded-full text-[#6b7280] dark:text-[#9ca3af] font-semibold">
                {pieces.length}
              </span>
            </div>

            <div className="space-y-3">
              {pieces.map(piece => (
                <div key={piece.id} className="bg-white dark:bg-[#1e2130] rounded-[16px] p-4 shadow-sm border border-[#f0f0f5] dark:border-[#2d3148] cursor-grab active:cursor-grabbing">
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-[#d1d5db] dark:text-[#4b5563] mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb] truncate">{piece.title}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {piece.platforms.map(p => (
                          <div key={p} className="w-4 h-4 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] || "#6b7280" }} title={p} />
                        ))}
                      </div>
                      {piece.scheduledFor && (
                        <p className="text-[11px] text-[#6b7280] dark:text-[#9ca3af] mt-1.5">{piece.scheduledFor}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button className="w-full flex items-center justify-center gap-1 text-xs text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#e5e7eb] py-2 rounded-xl border border-dashed border-[#e5e7eb] dark:border-[#2d3148] transition">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarView() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleString("default", { month: "long", year: "numeric" });

  const cells: (number | null)[] = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Mock scheduled items
  const scheduled: Record<number, string[]> = {
    [today.getDate() + 2]: ["Weekly Tips Reel"],
    [today.getDate() + 5]: ["Brand Partnership Post"],
    [today.getDate() + 8]: ["YouTube Tutorial"],
  };

  return (
    <div className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148]">
      <h3 className="text-lg font-bold text-[#111827] dark:text-[#f9fafb] mb-4">{monthName}</h3>
      <div className="grid grid-cols-7 gap-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} className="text-center text-[10px] uppercase text-[#9ca3af] font-semibold py-1">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            className={`min-h-[80px] rounded-xl p-1.5 border ${
              day === today.getDate()
                ? "border-[#6366f1] bg-[#6366f1]/5"
                : "border-[#f0f0f5] dark:border-[#2d3148]"
            } ${day ? "hover:bg-[#f9fafb] dark:hover:bg-[#252836] cursor-pointer" : ""}`}
          >
            {day && (
              <>
                <span className={`text-xs font-semibold ${day === today.getDate() ? "text-[#6366f1]" : "text-[#374151] dark:text-[#e5e7eb]"}`}>
                  {day}
                </span>
                {scheduled[day]?.map((item, j) => (
                  <div key={j} className="mt-1 text-[9px] bg-[#6366f1]/10 text-[#6366f1] rounded px-1 py-0.5 truncate font-medium">
                    {item}
                  </div>
                ))}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudioPlanView() {
  const [view, setView] = useState<"kanban" | "calendar">("kanban");

  return (
    <div className="space-y-4 max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-[#111827] dark:text-[#f9fafb]">Content Plan</h2>
        <div className="flex items-center bg-[#f3f3f8] dark:bg-[#252836] rounded-xl p-1">
          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              view === "calendar" ? "bg-white dark:bg-[#1e2130] text-[#111827] dark:text-[#f9fafb] shadow-sm" : "text-[#6b7280] dark:text-[#9ca3af]"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Calendar
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              view === "kanban" ? "bg-white dark:bg-[#1e2130] text-[#111827] dark:text-[#f9fafb] shadow-sm" : "text-[#6b7280] dark:text-[#9ca3af]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Kanban
          </button>
        </div>
      </div>

      {view === "kanban" ? <KanbanView /> : <CalendarView />}
    </div>
  );
}
