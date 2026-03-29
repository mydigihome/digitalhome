import { useState } from "react";
import { Mic, Users, Mail, Store, Download, User, Plus, Calendar, LayoutGrid } from "lucide-react";

type StreamCard = {
  id: string;
  icon: React.ElementType;
  label: string;
  enabled: boolean;
  stats: { label: string; value: string }[];
};

const STREAMS: StreamCard[] = [
  { id: "podcast", icon: Mic, label: "Podcast", enabled: true, stats: [
    { label: "Total Listeners", value: "4,200" },
    { label: "Avg / Episode", value: "340" },
    { label: "Downloads / Mo", value: "1,200" },
  ]},
  { id: "membership", icon: Users, label: "Membership", enabled: true, stats: [
    { label: "Active Members", value: "86" },
    { label: "New This Month", value: "+12" },
    { label: "MRR", value: "$430" },
  ]},
  { id: "newsletter", icon: Mail, label: "Newsletter", enabled: true, stats: [
    { label: "Subscribers", value: "2,340" },
    { label: "Open Rate", value: "42%" },
    { label: "Click Rate", value: "8.1%" },
  ]},
  { id: "merch", icon: Store, label: "Merch", enabled: false, stats: [] },
  { id: "digital", icon: Download, label: "Digital Products", enabled: false, stats: [] },
  { id: "coaching", icon: User, label: "Coaching", enabled: false, stats: [] },
];

const MOCK_CONTENT = [
  { id: "1", title: "Weekly Tips Reel", platforms: ["Instagram"], status: "in_progress", date: "Next Tuesday" },
  { id: "2", title: "YouTube Tutorial", platforms: ["YouTube"], status: "idea", date: "" },
  { id: "3", title: "Brand Partnership Post", platforms: ["Instagram", "TikTok"], status: "scheduled", date: "Apr 2" },
  { id: "4", title: "Productivity Hacks Thread", platforms: ["Twitter/X"], status: "idea", date: "" },
  { id: "5", title: "BTS Studio Setup", platforms: ["Instagram", "YouTube"], status: "published", date: "Mar 25" },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  idea: { label: "Idea", color: "#9ca3af", bg: "#f3f3f8" },
  in_progress: { label: "In Progress", color: "#f59e0b", bg: "#fffbeb" },
  scheduled: { label: "Scheduled", color: "#6366f1", bg: "#eef2ff" },
  published: { label: "Published", color: "#16a34a", bg: "#f0fdf4" },
};

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E1306C", YouTube: "#FF0000", TikTok: "#000000", "Twitter/X": "#1DA1F2",
};

export default function StudioHQView() {
  const [planView, setPlanView] = useState<"kanban" | "calendar">("kanban");

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      {/* Revenue Streams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STREAMS.map(stream => (
          <div key={stream.id} className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
            <div className="flex items-center gap-2 mb-3">
              <stream.icon className="w-4 h-4 text-[#6366f1]" />
              <span className="font-bold text-sm text-[#111827] dark:text-[#f9fafb]">{stream.label}</span>
            </div>
            {stream.enabled ? (
              <div className="grid grid-cols-3 gap-2">
                {stream.stats.map(s => (
                  <div key={s.label}>
                    <p className="font-extrabold text-lg text-[#111827] dark:text-[#f9fafb]">{s.value}</p>
                    <p className="text-[10px] uppercase text-[#9ca3af] tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-[#9ca3af] mb-2">Not set up yet</p>
                <button className="text-xs font-semibold text-[#6366f1] bg-[#6366f1]/10 dark:bg-[#2d2b4e] rounded-full px-3 py-1 hover:opacity-80 transition">
                  Enable
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Content Plan */}
      <div className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-base text-[#111827] dark:text-[#f9fafb]">Content Plan</p>
          <div className="flex items-center gap-1 bg-[#f3f3f8] dark:bg-[#252836] rounded-full p-0.5">
            <button
              onClick={() => setPlanView("kanban")}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                planView === "kanban" ? "bg-white dark:bg-[#1e2130] text-[#111827] dark:text-[#f9fafb] shadow-sm" : "text-[#9ca3af]"
              }`}
            >
              <LayoutGrid className="w-3 h-3" /> Kanban
            </button>
            <button
              onClick={() => setPlanView("calendar")}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                planView === "calendar" ? "bg-white dark:bg-[#1e2130] text-[#111827] dark:text-[#f9fafb] shadow-sm" : "text-[#9ca3af]"
              }`}
            >
              <Calendar className="w-3 h-3" /> Calendar
            </button>
          </div>
        </div>

        {planView === "kanban" ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {Object.entries(STATUS_MAP).map(([statusId, info]) => {
              const items = MOCK_CONTENT.filter(c => c.status === statusId);
              return (
                <div key={statusId} className="bg-[#f9fafb] dark:bg-[#252836] rounded-[20px] p-3 min-h-[200px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
                    <span className="text-sm font-bold text-[#111827] dark:text-[#f9fafb]">{info.label}</span>
                    <span className="text-xs bg-white dark:bg-[#1e2130] px-2 py-0.5 rounded-full text-[#6b7280] font-semibold ml-auto">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.id} className="bg-white dark:bg-[#1e2130] rounded-[14px] p-3 border border-[#f0f0f5] dark:border-[#2d3148] shadow-sm">
                        <p className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb] mb-1">{item.title}</p>
                        <div className="flex items-center gap-1.5">
                          {item.platforms.map(p => (
                            <div key={p} className="w-3 h-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] || "#6b7280" }} title={p} />
                          ))}
                        </div>
                        {item.date && <p className="text-[10px] text-[#9ca3af] mt-1">{item.date}</p>}
                      </div>
                    ))}
                    <button className="w-full flex items-center justify-center gap-1 text-xs text-[#9ca3af] py-2 rounded-xl border border-dashed border-[#e5e7eb] dark:border-[#2d3148] hover:text-[#374151] transition">
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-[#9ca3af]">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Calendar view coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
