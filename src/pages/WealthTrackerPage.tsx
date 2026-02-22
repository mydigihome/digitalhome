import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Receipt, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import AppShell from "@/components/AppShell";
import SubscriptionsTab from "@/components/wealth/SubscriptionsTab";
import MonthlySpendingTab from "@/components/wealth/MonthlySpendingTab";
import SavingsGoalsTab from "@/components/wealth/SavingsGoalsTab";
import InvestmentsTab from "@/components/wealth/InvestmentsTab";

const TABS = [
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "spending", label: "Monthly Spending", icon: Receipt },
  { id: "savings", label: "Savings Goals", icon: Target },
  { id: "investments", label: "Investments", icon: TrendingUp },
] as const;

type TabId = typeof TABS[number]["id"];

export default function WealthTrackerPage() {
  const [activeTab, setActiveTab] = useState<TabId>("subscriptions");

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">💰</span>
          <h1 className="text-3xl font-bold text-foreground">Wealth Tracker</h1>
        </div>

        {/* Sub-navigation */}
        <div className="mb-8">
          <nav className="flex gap-1 p-1 rounded-xl bg-muted/40 border border-border w-fit">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "subscriptions" && <SubscriptionsTab />}
          {activeTab === "spending" && <MonthlySpendingTab />}
          {activeTab === "savings" && <SavingsGoalsTab />}
          {activeTab === "investments" && <InvestmentsTab />}
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
