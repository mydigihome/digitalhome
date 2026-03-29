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
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", { month: "long", day: "numeric" });

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
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[#f0f0f5] dark:border-[#2d3148]">
          <span className="text-sm text-[#9ca3af] font-medium">{dayName}, {dateStr}</span>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#111827] dark:text-[#f9fafb]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Studio
            </h1>
            <span className="text-[10px] font-bold text-[#6366f1] animate-pulse">● LIVE</span>
          </div>
          <button className="text-xs text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#e5e7eb] transition font-medium">
            Sync All
          </button>
        </div>

        {/* Tabs */}
        <div className="shrink-0 border-b border-[#f0f0f5] dark:border-[#2d3148] px-4 sm:px-8">
          <div className="flex items-center gap-6 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`pb-2 pt-3 text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === t.id
                    ? "border-[#6366f1] text-[#6366f1] font-semibold"
                    : "border-transparent text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#e5e7eb]"
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
