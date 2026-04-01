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
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Check, Shield, Settings2, ColumnsIcon, CalendarDays, Lightbulb, Hash, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useUpsertPreferences } from "@/hooks/useUserPreferences";

const stripePromise = loadStripe("pk_test_51T0ZZyDs3UlCCXBa9qLPUy9c2w3osnYHXs1JKuALZkoOWZ688sRtnGzOJ0AaXXlD0CGI0cUSH9gOjzmlRRmcASeU00YOjg9k0v");

const TAB_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  setup: { label: "SETUP", icon: Settings2 },
  weekly: { label: "WEEKLY", icon: ColumnsIcon },
  monthly: { label: "MONTHLY", icon: CalendarDays },
  ideas: { label: "IDEAS BANK", icon: Lightbulb },
  hashtags: { label: "HASHTAGS", icon: Hash },
  strategy: { label: "STRATEGY", icon: Sparkles },
};

const PAYWALL_FEATURES = [
  "Weekly & Monthly content calendar",
  "Visual content studio with previews",
  "Hashtag manager & strategy planner",
  "Ideas bank for content inspiration",
  "Brand collaboration tracker",
  "Social media quick links & analytics",
];

function ContentPaywall() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: "price_content_planner_47", userId: user.id, mode: "payment", successUrl: `${window.location.origin}/vision?payment=success`, cancelUrl: `${window.location.origin}/vision` },
      });
      if (error) throw error;
      const stripe = await stripePromise;
      if (stripe && data?.url) {
        window.location.href = data.url;
      } else if (stripe && data?.sessionId) {
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
      }
    } catch {
      toast.error("Unable to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden">
      {/* Blurred preview background */}
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-16 opacity-30 blur-md pointer-events-none select-none">
        <div className="w-[90%] max-w-xl space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 rounded-2xl" style={{ backgroundColor: i % 2 === 0 ? "#EEF2FF" : "#F1F5F9" }} />
          ))}
        </div>
      </div>

      {/* Paywall card */}
      <div className="relative z-10 max-w-md mx-auto px-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center">
          {/* Lock icon */}
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            <Lock className="w-7 h-7 text-white" />
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: "#0F172A" }}>Unlock Content Planner</h2>
          <p className="text-sm text-muted-foreground mb-4">The ultimate tool for content creators</p>

          {/* Early access badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5 text-xs font-semibold" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>
             First 50 users get FREE access!
          </div>

          {/* Features */}
          <div className="text-left space-y-3 mb-6">
            {PAYWALL_FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EEF2FF" }}>
                  <Check className="w-3 h-3" style={{ color: "#6366F1" }} />
                </div>
                <span className="text-sm" style={{ color: "#374151" }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Pricing */}
          <div className="mb-4">
            <span className="text-4xl font-bold" style={{ color: "#0F172A" }}>$47</span>
            <span className="text-sm text-muted-foreground ml-1">one-time</span>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Lifetime access • No subscription</p>

          {/* CTA */}
          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
          >
            {loading ? "Redirecting..." : "Unlock Content Planner"}
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-4">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Secure checkout • 30-day money-back guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentPlanner() {
  const state = useContentPlannerState();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const [activeTab, setActiveTab] = useState("weekly");
  const [dragTab, setDragTab] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useAuth();

  // Admin bypass: email match, DB flags, or early signup
  const isAdmin = user?.email === "myslimher@gmail.com" ||
    (prefs as any)?.content_planner_is_admin === true ||
    (prefs as any)?.content_planner_access === true;
  const hasAccess = isAdmin || ((prefs as any)?.signup_number != null && (prefs as any)?.signup_number <= 50);
  const fullAccess = hasAccess;

  // Handle payment success
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      upsertPrefs.mutate({ content_planner_access: true } as any);
      toast.success("Content Planner unlocked! ");
      setSearchParams({}, { replace: true });
    }
  }, []);

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
      <div className="flex flex-col w-full bg-white" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif", height: "100%", margin: 0, padding: 0 }}>
        {!fullAccess ? (
          <ContentPaywall />
        ) : (
          <>
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

            {/* Bottom tab bar – Stitch style with icons */}
            <div className="flex items-center justify-around bg-white shrink-0 py-1" style={{ borderTop: "1px solid #F0F0F0" }}>
              {state.tabOrder.map(tabId => {
                const config = TAB_CONFIG[tabId];
                if (!config) return null;
                const Icon = config.icon;
                const isActive = activeTab === tabId;
                return (
                  <button
                    key={tabId}
                    draggable
                    onDragStart={() => handleDragStart(tabId)}
                    onDragOver={e => handleDragOver(e, tabId)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setActiveTab(tabId)}
                    className={`flex flex-col items-center gap-0.5 px-3 py-2 transition-all duration-150 relative cursor-grab active:cursor-grabbing ${
                      isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute top-0 left-2 right-2 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, #6366F1, #8B5CF6)" }} />
                    )}
                    <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                    <span className={`text-[10px] tracking-wider ${isActive ? "font-bold" : "font-semibold"}`}>
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
