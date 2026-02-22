import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useContentPlannerState } from "@/components/content-planner/useContentPlannerState";
import SetupTab from "@/components/content-planner/SetupTab";
import WeeklyCalendarTab from "@/components/content-planner/WeeklyCalendarTab";
import MonthlyViewTab from "@/components/content-planner/MonthlyViewTab";
import IdeasBankTab from "@/components/content-planner/IdeasBankTab";
import HashtagManagerTab from "@/components/content-planner/HashtagManagerTab";
import StrategyTab from "@/components/content-planner/StrategyTab";

const TABS = [
  { id: "setup", label: "📋 Setup" },
  { id: "weekly", label: "📅 Weekly Calendar" },
  { id: "monthly", label: "🗓 Monthly View" },
  { id: "ideas", label: "💡 Ideas Bank" },
  { id: "hashtags", label: "# Hashtags" },
  { id: "strategy", label: "🎯 Strategy" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function ContentPlanner() {
  const [activeTab, setActiveTab] = useState<TabId>("weekly");
  const state = useContentPlannerState();

  return (
    <AppShell>
      <div className="flex h-full flex-col" style={{ background: "#FAF7F2", fontFamily: "'DM Sans', sans-serif" }}>
        {/* Content area */}
        <div className="flex-1 overflow-auto p-3 sm:p-5">
          <h1 className="mb-4 text-xl font-bold tracking-tight" style={{ color: "#2C2C2C" }}>
            Content Planner
          </h1>

          {activeTab === "setup" && <SetupTab setup={state.setup} setSetup={state.setSetup} />}
          {activeTab === "weekly" && (
            <WeeklyCalendarTab
              setup={state.setup}
              week={state.week}
              setWeek={state.setWeek}
              updateDay={state.updateDay}
              updateDayChecklist={state.updateDayChecklist}
              updateDayAnalytics={state.updateDayAnalytics}
            />
          )}
          {activeTab === "monthly" && <MonthlyViewTab week={state.week} />}
          {activeTab === "ideas" && <IdeasBankTab setup={state.setup} ideas={state.ideas} setIdeas={state.setIdeas} />}
          {activeTab === "hashtags" && <HashtagManagerTab hashtagGroups={state.hashtagGroups} setHashtagGroups={state.setHashtagGroups} />}
          {activeTab === "strategy" && <StrategyTab strategy={state.strategy} setStrategy={state.setStrategy} />}
        </div>

        {/* Bottom sheet tabs */}
        <div
          className="flex items-stretch overflow-x-auto border-t"
          style={{ borderColor: "#C9B99A", background: "#E8E0D5" }}
        >
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="whitespace-nowrap px-4 py-2.5 text-xs font-semibold transition-colors"
              style={{
                color: activeTab === tab.id ? "#2C2C2C" : "#8B7E6A",
                background: activeTab === tab.id ? "#FAF7F2" : "transparent",
                borderRight: "1px solid #C9B99A",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
