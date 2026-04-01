import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AlertTriangle, Gift } from "lucide-react";

export function TrialBadge() {
  const { data: prefs } = useUserPreferences();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  const isFoundingMember = profile?.founding_member === true;

  useEffect(() => {
    if (prefs?.trial_end_date && !prefs?.is_subscribed && !isFoundingMember) {
      const endDate = new Date(prefs.trial_end_date);
      const now = new Date();
      const diffMs = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      setDaysLeft(Math.max(0, diffDays));
    }
  }, [prefs?.trial_end_date, prefs?.is_subscribed, isFoundingMember]);

  if (isFoundingMember) return null;
  if ((!daysLeft && daysLeft !== 0) || prefs?.is_subscribed) return null;
  if (daysLeft === 0) return null;

  const isWarning = daysLeft <= 3;

  return (
    <button
      onClick={() => navigate("/settings?tab=billing")}
      title="Click to view upgrade options"
      className="flex items-center gap-1.5 transition-transform hover:scale-105"
      style={{
        padding: '4px 12px',
        backgroundColor: isWarning ? '#FEF3C7' : '#EEF2FF',
        border: `1px solid ${isWarning ? '#FCD34D' : '#C7D2FE'}`,
        borderRadius: '12px',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: '14px' }}>
        {isWarning ? <AlertTriangle className="w-4 h-4 text-warning" /> : <Gift className="w-4 h-4 text-primary" />}
      </span>
      <span
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: isWarning ? '#92400E' : '#4F46E5',
        }}
      >
        {daysLeft} day{daysLeft !== 1 ? 's' : ''}
      </span>
    </button>
  );
}
