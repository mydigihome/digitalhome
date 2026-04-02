import { useState } from "react";
import AppShell from "@/components/AppShell";
import StudioOverview from "@/components/studio/StudioOverview";
import StudioHQView from "@/components/studio/StudioHQView";
import StudioPlatformsView from "@/components/studio/StudioPlatformsView";
import StudioDealsView from "@/components/studio/StudioDealsView";
import StudioRevenueView from "@/components/studio/StudioRevenueView";
import StudioHeaderCard from "@/components/studio/StudioHeaderCard";

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <StudioOverview onNavigateDeals={() => setActiveTab("deals")} />;
      case "hq": return <StudioHQView />;
      case "platforms": return <StudioPlatformsView />;
      case "deals": return <StudioDealsView />;
      case "revenue": return <StudioRevenueView />;
      default: return <StudioOverview onNavigateDeals={() => setActiveTab("deals")} />;
    }
  };

  const isDark = document.documentElement.classList.contains("dark");
  const TABS = ["Overview", "HQ", "Platforms", "Deals", "Revenue"];

  return (
    <AppShell>
      <div className="h-full flex flex-col" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-white dark:bg-[#0f1117]">
          <StudioHeaderCard activeTab={activeTab} onTabChange={setActiveTab} />
          {/* Standalone pill tabs */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", padding: "16px 0" }}>
            {TABS.map(tab => {
              const tabId = tab.toLowerCase();
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tabId)}
                  style={{
                    padding: "7px 18px",
                    borderRadius: "999px",
                    border: "1px solid",
                    borderColor: isActive
                      ? "#10B981"
                      : (isDark ? "rgba(255,255,255,0.15)" : "#E5E7EB"),
                    background: isActive
                      ? "#10B981"
                      : (isDark ? "transparent" : "white"),
                    color: isActive
                      ? "white"
                      : (isDark ? "rgba(255,255,255,0.6)" : "#374151"),
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    transition: "all 150ms ease",
                    boxShadow: isActive ? "0 2px 8px rgba(16,185,129,0.3)" : "none",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "#10B981";
                      (e.currentTarget as HTMLButtonElement).style.color = isDark ? "#10B981" : "#065F46";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = isDark ? "transparent" : "white";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? "rgba(255,255,255,0.15)" : "#E5E7EB";
                      (e.currentTarget as HTMLButtonElement).style.color = isDark ? "rgba(255,255,255,0.6)" : "#374151";
                    }
                  }}>
                  {tab}
                </button>
              );
            })}
          </div>
          {renderContent()}
        </div>
      </div>
    </AppShell>
  );
}
