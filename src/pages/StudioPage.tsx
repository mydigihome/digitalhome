import { useState } from "react";
import AppShell from "@/components/AppShell";
import StudioOverview from "@/components/studio/StudioOverview";
import StudioHQView from "@/components/studio/StudioHQView";
import StudioPlatformsView from "@/components/studio/StudioPlatformsView";
import StudioDealsView from "@/components/studio/StudioDealsView";
import StudioRevenueView from "@/components/studio/StudioRevenueView";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "hq", label: "HQ" },
  { id: "platforms", label: "Platforms" },
  { id: "deals", label: "Deals" },
  { id: "revenue", label: "Revenue" },
];

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const timeStr = today.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZoneName: "short" });

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <StudioOverview />;
      case "hq": return <StudioHQView />;
      case "platforms": return <StudioPlatformsView />;
      case "deals": return <StudioDealsView />;
      case "revenue": return <StudioRevenueView />;
      default: return <StudioOverview />;
    }
  };

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-8 py-4">
          <span className="text-[15px] font-semibold text-[#111827] dark:text-[#f9fafb]">
            Command Center
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] inline-block" />
              <span className="text-[10px] font-medium text-[#16a34a]">LIVE</span>
            </span>
            <span className="text-[11px] text-[#9ca3af]">{dateStr} at {timeStr}</span>
            <button className="text-[11px] text-[#6366f1] hover:underline">Refresh</button>
            <button className="text-[11px] text-[#9ca3af] hover:text-[#374151]">Restart</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 border-b border-[#e5e7eb] dark:border-[#2d3148] px-4 sm:px-8">
          <div className="flex items-center gap-5 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`pb-2.5 text-[13px] whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === t.id
                    ? "border-[#111827] dark:border-[#f9fafb] text-[#111827] dark:text-[#f9fafb] font-medium"
                    : "border-transparent text-[#6b7280] hover:text-[#374151] dark:hover:text-[#e5e7eb]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-[#f3f3f8] dark:bg-[#0f1117]">
          {renderContent()}
        </div>
      </div>
    </AppShell>
  );
}
