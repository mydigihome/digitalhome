import { useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useContentPlannerState } from "@/components/content-planner/useContentPlannerState";
import VisualContentStudio from "@/components/content-planner/VisualContentStudio";
import WeeklyCalendarTab from "@/components/content-planner/WeeklyCalendarTab";
import MonthlyViewTab from "@/components/content-planner/MonthlyViewTab";
import IdeasBankTab from "@/components/content-planner/IdeasBankTab";
import HashtagManagerTab from "@/components/content-planner/HashtagManagerTab";
import StrategyTab from "@/components/content-planner/StrategyTab";
import SocialQuickLinks from "@/components/content-planner/SocialQuickLinks";
import CollaboratorPanel from "@/components/content-planner/CollaboratorPanel";

const TAB_LABELS: Record<string, string> = {
  setup: "Setup",
  weekly: "Weekly",
  monthly: "Monthly",
  ideas: "Ideas Bank",
  hashtags: "Hashtags",
  strategy: "Strategy",
};

export default function ContentPlanner() {
  const state = useContentPlannerState();
  const [activeTab, setActiveTab] = useState("weekly");
  const [dragTab, setDragTab] = useState<string | null>(null);

  const handleDragStart = useCallback((tabId: string) => {
    setDragTab(tabId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    if (!dragTab || dragTab === tabId) return;
    const order = [...state.tabOrder];
    const fromIdx = order.indexOf(dragTab);
    const toIdx = order.indexOf(tabId);
    if (fromIdx === -1 || toIdx === -1) return;
    order.splice(fromIdx, 1);
    order.splice(toIdx, 0, dragTab);
    state.setTabOrder(order);
  }, [dragTab, state.tabOrder, state.setTabOrder]);

  const handleDragEnd = useCallback(() => {
    setDragTab(null);
  }, []);

  return (
    <AppShell>
      <div className="flex flex-col w-full bg-white" style={{ fontFamily: "Inter, system-ui, sans-serif", height: "100%", margin: 0, padding: 0 }}>
        {/* Top bar with social quick links */}
        <div className="flex items-center justify-end gap-3 px-4 py-2 shrink-0">
          <CollaboratorPanel />
          <SocialQuickLinks links={state.socialLinks} setLinks={state.setSocialLinks} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0">
          {activeTab === "setup" && <VisualContentStudio feedPosts={state.feedPosts} setFeedPosts={state.setFeedPosts} studioProfile={state.studioProfile} setStudioProfile={state.setStudioProfile} />}
          {activeTab === "weekly" && (
            <WeeklyCalendarTab
              setup={state.setup}
              week={state.currentWeek}
              weekStart={state.currentWeekStart}
              setWeek={state.setCurrentWeek}
              navigateWeek={state.navigateWeek}
              addPost={state.addPost}
              updatePost={state.updatePost}
              deletePost={state.deletePost}
              movePost={state.movePost}
              updatePostChecklist={state.updatePostChecklist}
              updatePostAnalytics={state.updatePostAnalytics}
              ideasTables={state.ideasTables}
              setIdeasTables={state.setIdeasTables}
            />
          )}
          {activeTab === "monthly" && <MonthlyViewTab setup={state.setup} getAllPosts={state.getAllPosts} />}
          {activeTab === "ideas" && <IdeasBankTab setup={state.setup} ideasTables={state.ideasTables} setIdeasTables={state.setIdeasTables} />}
          {activeTab === "hashtags" && <HashtagManagerTab hashtagGroups={state.hashtagGroups} setHashtagGroups={state.setHashtagGroups} />}
          {activeTab === "strategy" && <StrategyTab strategy={state.strategy} setStrategy={state.setStrategy} />}
        </div>

        {/* Bottom tab bar */}
        <div className="flex items-center bg-white shrink-0" style={{ borderTop: "1px solid #F0F0F0" }}>
          {state.tabOrder.map(tabId => (
            <button
              key={tabId}
              draggable
              onDragStart={() => handleDragStart(tabId)}
              onDragOver={e => handleDragOver(e, tabId)}
              onDragEnd={handleDragEnd}
              onClick={() => setActiveTab(tabId)}
              className={`flex-1 px-3 py-3 text-[14px] transition-all duration-150 relative cursor-grab active:cursor-grabbing ${
                activeTab === tabId
                  ? "text-gray-900 font-medium"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {activeTab === tabId && (
                <span className="absolute top-0 left-0 right-0 h-[2px] bg-gray-900" />
              )}
              {TAB_LABELS[tabId] || tabId}
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
