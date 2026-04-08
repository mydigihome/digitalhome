import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMonthlyReviews } from "@/hooks/useMonthlyReviews";
import { useUserPreferences } from "@/hooks/useUserPreferences";

export default function MonthlyReviewBanner() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: reviews = [] } = useMonthlyReviews();
  const { data: prefs } = useUserPreferences();
  const [dismissed, setDismissed] = useState(false);

  const isFoundingMember = profile?.founding_member === true;
  const isSubscribed = prefs?.is_subscribed === true;
  if (!isFoundingMember && !isSubscribed) return null;

  const now = new Date();
  const dayOfMonth = now.getDate();
  const month = now.getMonth();
  const year = now.getFullYear();
  const isFirstOfMonth = dayOfMonth === 1;

  // Never show to new users (no prefs or recently onboarded)
  if (!prefs?.onboarding_completed) return null;

  // Check localStorage dismiss
  const dismissKey = `review_prompt_${year}_${month + 1}`;
  const alreadySeen = localStorage.getItem(dismissKey);

  // Only show on the 1st of the month and if not already dismissed
  if (!isFirstOfMonth || alreadySeen || dismissed) return null;

  const prevMonthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long" });

  const prevMonthReview = reviews.find((r: any) => {
    const rm = (r.review_month || "").toLowerCase();
    return rm.includes(prevMonthName.toLowerCase());
  });
  const reviewApproved = !!prevMonthReview;

  // Never show if user has no data at all (brand new user)
  if (reviews.length === 0 && !reviewApproved) {
    const createdAt = prefs?.created_at ? new Date(prefs.created_at) : null;
    if (!createdAt || (now.getTime() - createdAt.getTime()) < 25 * 24 * 60 * 60 * 1000) {
      return null;
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, 'seen');
    setDismissed(true);
  };

  const baseStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: "Inter, sans-serif",
    zIndex: 10,
    position: "relative",
    cursor: "pointer",
  };

  if (!reviewApproved) {
    return (
      <div
        onClick={() => {
          handleDismiss();
          navigate("/monthly-review");
        }}
        style={{ ...baseStyle, background: "#eef2ff", borderBottom: "1px solid #c7d2fe", justifyContent: "center" }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#312e81" }}>
          Your {prevMonthName} review is ready —
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#6366f1", marginLeft: 4 }}>
          see how you did →
        </span>
      </div>
    );
  }

  if (reviewApproved) {
    return (
      <div
        style={{ ...baseStyle, background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", cursor: "default" }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "#15803d" }}>
          {prevMonthName} review approved. Saved to your archive.
        </span>
        <span
          onClick={() => navigate("/monthly-review?mode=read")}
          style={{ fontSize: 12, fontWeight: 600, color: "#16a34a", cursor: "pointer" }}
        >
          View
        </span>
      </div>
    );
  }

  return null;
}
