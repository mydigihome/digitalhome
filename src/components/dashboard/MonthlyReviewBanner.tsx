import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMonthlyReviews } from "@/hooks/useMonthlyReviews";
import { useUserPreferences } from "@/hooks/useUserPreferences";

export default function MonthlyReviewBanner() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: reviews = [] } = useMonthlyReviews();
  const { data: prefs } = useUserPreferences();

  const isFoundingMember = profile?.founding_member === true;
  const isSubscribed = prefs?.is_subscribed === true;
  if (!isFoundingMember && !isSubscribed) return null;

  const today = new Date();
  const dayOfMonth = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const isLastThreeDays = dayOfMonth >= lastDay - 2;
  const isFirstSevenDays = dayOfMonth <= 7;
  const monthName = today.toLocaleString("default", { month: "long" });
  const prevMonthName = new Date(year, month - 1, 1).toLocaleString("default", { month: "long" });

  const prevMonthReview = reviews.find((r: any) => {
    const rm = (r.review_month || "").toLowerCase();
    return rm.includes(prevMonthName.toLowerCase());
  });
  const reviewApproved = !!prevMonthReview;

  // Temporarily force banner visible for testing — remove after confirming
  const showBanner = true;

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

  // STATE A: last 3 days of current month
  if (isLastThreeDays) {
    return (
      <div
        onClick={() => navigate("/monthly-review")}
        style={{ ...baseStyle, background: "#eef2ff", borderBottom: "1px solid #c7d2fe" }}
      >
        <p style={{ margin: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#4338ca" }}>
            Almost done with {monthName} —
          </span>
          <span style={{ fontSize: 13, fontWeight: 400, color: "#6366f1" }}>
            {" "}your review will be ready on the 1st.
          </span>
        </p>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#4f46e5", cursor: "pointer" }}>
          Preview →
        </span>
      </div>
    );
  }

  // STATE B: first 7 days OR forced, review not approved
  if ((isFirstSevenDays || showBanner) && !reviewApproved) {
    return (
      <div
        onClick={() => navigate("/monthly-review")}
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

  // STATE C: first 7 days, approved
  if ((isFirstSevenDays || showBanner) && reviewApproved) {
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
