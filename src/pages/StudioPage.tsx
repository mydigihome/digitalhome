import { useState } from "react";
import AppShell from "@/components/AppShell";
import StudioOverview from "@/components/studio/StudioOverview";
import StudioHQView from "@/components/studio/StudioHQView";
import StudioPlatformsView from "@/components/studio/StudioPlatformsView";
import StudioDealsView from "@/components/studio/StudioDealsView";
import StudioRevenueView from "@/components/studio/StudioRevenueView";
import StudioHeaderCard from "@/components/studio/StudioHeaderCardV2";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlan } from "@/hooks/usePlan";
import LockedFeature from "@/components/LockedFeature";

export default function StudioPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const isMobile = useIsMobile();
  const { studioUnlocked, isLoading: planLoading } = usePlan();

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
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-background">
          <StudioHeaderCard activeTab={activeTab} onTabChange={setActiveTab} />
          {/* Standalone pill tabs */}
          <div style={{
            display: "flex",
            justifyContent: isMobile ? "flex-start" : "center",
            gap: "8px",
            padding: "16px 0",
            overflowX: isMobile ? "auto" : undefined,
            WebkitOverflowScrolling: "touch",
          }}>
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
                    whiteSpace: "nowrap",
                    flexShrink: 0,
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
          {studioUnlocked || planLoading ? (
            renderContent()
          ) : (
            <LockedFeature feature="studio">
              {renderContent()}
            </LockedFeature>
          )}
        </div>
      </div>
    </AppShell>
  );
}
