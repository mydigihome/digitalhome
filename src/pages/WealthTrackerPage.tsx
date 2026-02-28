import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import AppShell from "@/components/AppShell";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useExpenses } from "@/hooks/useExpenses";
import { useLoans } from "@/hooks/useLoans";
import { useChildInvestments } from "@/hooks/useChildInvestments";
import { useWealthGoals } from "@/hooks/useWealthGoals";
import { useAuth } from "@/hooks/useAuth";
import WealthOnboarding from "@/components/wealth/WealthOnboarding";
import WealthDashboard from "@/components/wealth/WealthDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function WealthTrackerPage() {
  const { data: finances, isLoading } = useUserFinances();
  const [justCompleted, setJustCompleted] = useState(false);

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
      <WealthDashboard />
    </AppShell>
  );
}
