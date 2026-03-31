import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, CreditCard, TrendingDown, TrendingUp, LineChart, Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useAuth } from "@/hooks/useAuth";
import WealthOnboarding from "@/components/wealth/WealthOnboarding";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import OverviewTab from "@/components/wealth/tabs/OverviewTab";
import SpendingTab from "@/components/wealth/tabs/SpendingTab";
import DebtTab from "@/components/wealth/tabs/DebtTab";
import InvestingTab from "@/components/wealth/tabs/InvestingTab";
import TradingTab from "@/components/wealth/tabs/TradingTab";
import TrackFinanceModal from "@/components/money/TrackFinanceModal";
import { useMoneyPreferences } from "@/hooks/useMoneyPreferences";

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "spending", label: "Spending", icon: CreditCard },
  { id: "debt", label: "Debt", icon: TrendingDown },
  { id: "investing", label: "Investing", icon: TrendingUp },
  { id: "trading", label: "Trading", icon: LineChart },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function WealthTrackerPage() {
  const { user } = useAuth();
  const { data: finances, isLoading } = useUserFinances();
  const [justCompleted, setJustCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [trackFinanceOpen, setTrackFinanceOpen] = useState(false);
  const { cardOrder, updateCardOrder } = useMoneyPreferences();

  const handleAddCards = (ids: string[]) => {
    const newOrder = [...cardOrder, ...ids.filter(id => !cardOrder.includes(id))];
    updateCardOrder(newOrder);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-4 p-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </AppShell>
    );
  }

  if (!finances?.onboarding_completed && !justCompleted) {
    return (
      <AppShell>
        <WealthOnboarding onComplete={() => setJustCompleted(true)} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen bg-background -m-4 sm:-m-6 p-5 sm:p-8 lg:p-10"
      >
        {/* ── Header + Tabs (matches Projects page) ── */}
        <div className="flex flex-col gap-5 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Money & Wealth</h1>
              <p className="text-sm text-muted-foreground mt-1">Track your finances, investments, and financial goals</p>
            </div>
            <button
              onClick={() => setTrackFinanceOpen(true)}
              className="flex items-center gap-2 rounded-[14px] bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add Card
            </button>
          </div>

          {/* Tab Navigation — pill style matching Projects view switcher */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-sm font-semibold whitespace-nowrap transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "spending" && <SpendingTab />}
            {activeTab === "debt" && <DebtTab />}
            {activeTab === "investing" && <InvestingTab />}
            {activeTab === "trading" && <TradingTab />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <TrackFinanceModal
        open={trackFinanceOpen}
        onClose={() => setTrackFinanceOpen(false)}
        existingCardIds={cardOrder}
        onAddCards={handleAddCards}
        plaidConnected={false}
      />
    </AppShell>
  );
}
