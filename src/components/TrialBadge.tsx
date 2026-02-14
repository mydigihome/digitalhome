import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export function TrialBadge() {
  const { data: prefs } = useUserPreferences();
  const navigate = useNavigate();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (prefs?.trial_end_date && !prefs?.is_subscribed && !prefs?.founding_member) {
      const endDate = new Date(prefs.trial_end_date);
      const now = new Date();
      const diffMs = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      setDaysLeft(Math.max(0, diffDays));
    }
  }, [prefs?.trial_end_date, prefs?.is_subscribed, prefs?.founding_member]);

  // Founding members never see trial badge
  if (prefs?.founding_member) return null;

  // Don't show if subscribed or no trial data
  if (!daysLeft && daysLeft !== 0 || prefs?.is_subscribed) {
    return null;
  }

  const isExpired = daysLeft === 0;
  const bgColor = isExpired
    ? "bg-destructive/10 hover:bg-destructive/20"
    : "bg-amber-500/10 hover:bg-amber-500/20";
  const textColor = isExpired ? "text-destructive" : "text-amber-700";
  const borderColor = isExpired ? "border-destructive/30" : "border-amber-200";

  return (
    <button
      onClick={() => navigate("/settings?tab=billing")}
      className={`fixed top-4 right-4 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${bgColor} ${textColor} ${borderColor} border z-50 hover:shadow-md`}
    >
      {isExpired
        ? "Trial expired"
        : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
    </button>
  );
}
