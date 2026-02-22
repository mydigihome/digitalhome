import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import AppShell from "@/components/AppShell";
import NetWorthHero from "@/components/wealth/NetWorthHero";
import SubscriptionsSection from "@/components/wealth/SubscriptionsSection";
import SpendingSection from "@/components/wealth/SpendingSection";
import BudgetEnvelopes from "@/components/wealth/BudgetEnvelopes";
import BillsCalendar from "@/components/wealth/BillsCalendar";
import SavingsSection from "@/components/wealth/SavingsSection";
import InvestmentsSection from "@/components/wealth/InvestmentsSection";

const NAV_ITEMS = [
  { id: "net-worth", label: "Net Worth" },
  { id: "subscriptions", label: "Subscriptions" },
  { id: "spending", label: "Spending" },
  { id: "budget", label: "Budget" },
  { id: "bills", label: "Bills" },
  { id: "goals", label: "Goals" },
  { id: "investments", label: "Investments" },
];

export default function WealthTrackerPage() {
  const [activeSection, setActiveSection] = useState("net-worth");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    NAV_ITEMS.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Page header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">Wealth Tracker</h1>
        </div>

        {/* Sticky mini-nav */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-3 pt-1 -mx-1 px-1">
          <nav className="flex gap-0.5 p-1 rounded-xl bg-muted/40 border border-border overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeSection === item.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Sections */}
        <div className="space-y-10 mt-4">
          <NetWorthHero />
          <SubscriptionsSection />
          <SpendingSection />
          <BudgetEnvelopes />
          <BillsCalendar />
          <SavingsSection />
          <InvestmentsSection />
        </div>
      </motion.div>
    </AppShell>
  );
}
