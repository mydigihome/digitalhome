import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useUserFinances } from "@/hooks/useUserFinances";
import { useAuth } from "@/hooks/useAuth";
import WealthOnboarding from "@/components/wealth/WealthOnboarding";
import MoneyTabWithSubTabs from "@/components/money/MoneyTabWithSubTabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function WealthTrackerPage() {
  const { user } = useAuth();
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
      <MoneyTabWithSubTabs />
    </AppShell>
  );
}
