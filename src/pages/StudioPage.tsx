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

  return (
    <AppShell>
      <div className="h-full flex flex-col">
        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-white dark:bg-[#0f1117]">
          <StudioHeaderCard activeTab={activeTab} onTabChange={setActiveTab} />
          {renderContent()}
        </div>
      </div>
    </AppShell>
  );
}
