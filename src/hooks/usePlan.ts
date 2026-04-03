import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PlanTier = "founding" | "standard" | "free";

export interface UserPlan {
  tier: PlanTier;
  studioUnlocked: boolean;
  templatesUnlocked: boolean;
  studentVerified: boolean;
  billingCycle: "monthly" | "annual";
  annualStartDate: string | null;
  renewalDate: string | null;
  isLoading: boolean;
}

export const usePlan = (): UserPlan => {
  const { user, profile } = useAuth();
  const [plan, setPlan] = useState<UserPlan>({
    tier: "free",
    studioUnlocked: false,
    templatesUnlocked: false,
    studentVerified: false,
    billingCycle: "monthly",
    annualStartDate: null,
    renewalDate: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      const { data } = await (supabase as any)
        .from("user_preferences")
        .select("plan_tier, studio_unlocked, templates_unlocked, student_verified, billing_cycle, annual_start_date, is_subscribed, subscription_type")
        .eq("user_id", user.id)
        .maybeSingle();

      // Founding members always have full access
      const isFoundingMember = profile?.founding_member === true;

      if (data) {
        const annualStart = data.annual_start_date ? new Date(data.annual_start_date) : null;
        const renewal = annualStart ? new Date(annualStart) : null;
        if (renewal) renewal.setFullYear(renewal.getFullYear() + 1);

        const effectiveTier: PlanTier = isFoundingMember
          ? "founding"
          : data.plan_tier || (data.is_subscribed ? "standard" : "free");

        setPlan({
          tier: effectiveTier,
          studioUnlocked: isFoundingMember || data.studio_unlocked || false,
          templatesUnlocked: isFoundingMember || data.templates_unlocked || false,
          studentVerified: data.student_verified || false,
          billingCycle: data.billing_cycle || "monthly",
          annualStartDate: data.annual_start_date || null,
          renewalDate: renewal
            ? renewal.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
            : null,
          isLoading: false,
        });
      } else {
        setPlan((prev) => ({
          ...prev,
          tier: isFoundingMember ? "founding" : "free",
          studioUnlocked: isFoundingMember,
          templatesUnlocked: isFoundingMember,
          isLoading: false,
        }));
      }
    };

    load();
  }, [user?.id, profile?.founding_member]);

  return plan;
};
