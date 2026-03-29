import { useState } from "react";
import AppShell from "@/components/AppShell";
import StudioOverview from "@/components/studio/StudioOverview";
import StudioPlatformView from "@/components/studio/StudioPlatformView";
import StudioPlanView from "@/components/studio/StudioPlanView";
import StudioDealsView from "@/components/studio/StudioDealsView";
import StudioRevenueView from "@/components/studio/StudioRevenueView";
import { Plus, Link2 } from "lucide-react";

const PLATFORMS = [
  { id: "overview", label: "Overview" },
  { id: "instagram", label: "Instagram", color: "#E1306C" },
  { id: "youtube", label: "YouTube", color: "#FF0000" },
  { id: "tiktok", label: "TikTok", color: "#000000" },
  { id: "twitter", label: "Twitter/X", color: "#1DA1F2" },
  { id: "facebook", label: "Facebook", color: "#1877F2" },
  { id: "pinterest", label: "Pinterest", color: "#E60023" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  { id: "plan", label: "Plan" },
  { id: "deals", label: "Deals" },
  { id: "revenue", label: "Revenue" },
];

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const renderContent = () => {
    if (activeTab === "overview") return <StudioOverview onNavigate={setActiveTab} />;
    if (activeTab === "plan") return <StudioPlanView />;
    if (activeTab === "deals") return <StudioDealsView />;
    if (activeTab === "revenue") return <StudioRevenueView />;
    const platform = PLATFORMS.find(p => p.id === activeTab);
    if (platform?.color) return <StudioPlatformView platform={activeTab} color={platform.color} />;
    return <StudioOverview onNavigate={setActiveTab} />;
  };

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* Top Bar */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[#f0f0f5] dark:border-[#2d3148]">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-[#111827] dark:text-[#f9fafb]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Studio
            </h1>
            <span className="inline-flex items-center gap-1 bg-[#6366f1] text-white text-[9px] font-bold rounded-full px-2 py-0.5 animate-pulse">
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 bg-[#6366f1] text-white rounded-[12px] px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition">
              <Plus className="w-4 h-4" /> New Content
            </button>
            <button className="flex items-center gap-1.5 bg-white dark:bg-[#1e2130] border border-[#e5e7eb] dark:border-[#2d3148] rounded-[12px] px-4 py-2.5 text-sm font-semibold text-[#374151] dark:text-[#e5e7eb] hover:bg-[#f9fafb] dark:hover:bg-[#252836] transition">
              <Link2 className="w-4 h-4" /> Connect Platform
            </button>
          </div>
        </div>

        {/* Horizontal Tabs */}
        <div className="shrink-0 overflow-x-auto border-b border-[#f0f0f5] dark:border-[#2d3148]">
          <div className="flex items-center gap-0 px-4 sm:px-8 min-w-max">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setActiveTab(p.id)}
                className={`px-4 py-3 text-sm whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === p.id
                    ? "border-[#6366f1] text-[#6366f1] font-semibold"
                    : "border-transparent text-[#6b7280] dark:text-[#9ca3af] hover:text-[#374151] dark:hover:text-[#e5e7eb]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          {renderContent()}
        </div>
      </div>
    </AppShell>
  );
}
