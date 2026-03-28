import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useMonthlyReviews } from "@/hooks/useMonthlyReviews";
import { format, subMonths } from "date-fns";
import { Check, Calendar } from "lucide-react";

export default function ReviewBanner() {
  const navigate = useNavigate();
  const { data: prefs } = useUserPreferences();
  const { data: reviews = [] } = useMonthlyReviews();

  const now = new Date();
  const day = now.getDate();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentMonthName = format(now, "MMMM");
  const prevMonth = subMonths(now, 1);
  const prevMonthName = format(prevMonth, "MMMM");
  const prevMonthReviewKey = `${prevMonthName} ${format(prevMonth, "yyyy")}`;

  const prevReview = reviews.find((r: any) => r.review_month === prevMonthReviewKey);
  const isLastThreeDays = day >= lastDay - 2;
  const isFirstSeven = day <= 7;

  // STATE C — Approved (show during first 7 days if previous month was approved)
  if (isFirstSeven && prevReview) {
    return (
      <div
        className="w-full rounded-[20px] px-6 py-3 flex items-center justify-between mb-4"
        style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
      >
        <div className="flex items-center gap-3">
          <Check className="w-4 h-4" style={{ color: "#16a34a" }} />
          <span className="font-semibold text-sm" style={{ color: "#15803d" }}>
            {prevMonthName} review approved.
          </span>
          <span className="text-sm" style={{ color: "#6b7280" }}>
            Archived in your records.
          </span>
        </div>
        <button
          onClick={() => navigate(`/monthly-review?id=${prevReview.id}&mode=read`)}
          className="text-xs font-semibold cursor-pointer"
          style={{ color: "#16a34a" }}
        >
          View
        </button>
      </div>
    );
  }

  // STATE B — Review ready (first 7 days, not yet approved)
  if (isFirstSeven && !prevReview) {
    return (
      <div
        className="w-full rounded-[20px] px-6 py-4 flex items-center justify-between mb-4 cursor-pointer"
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid rgba(99,102,241,0.2)",
          boxShadow: "0 4px 20px rgba(99,102,241,0.08)",
        }}
        onClick={() => navigate("/monthly-review")}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: "#6366f1" }}
          />
          <span className="font-bold text-sm" style={{ color: "#111827" }}>
            Welcome to {currentMonthName}.
          </span>
          <span className="text-sm" style={{ color: "#6b7280" }}>
            Your {prevMonthName} review is ready —{" "}
          </span>
          <span className="text-sm font-semibold" style={{ color: "#6366f1" }}>
            see how you did →
          </span>
        </div>
        <button
          className="rounded-full px-4 py-1.5 text-xs font-semibold text-white transition-colors"
          style={{ backgroundColor: "#6366f1" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4f46e5")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6366f1")}
        >
          View Review
        </button>
      </div>
    );
  }

  // STATE A — Almost done (last 3 days of month)
  if (isLastThreeDays) {
    return (
      <div
        className="w-full rounded-[20px] px-6 py-3.5 flex items-center justify-between mb-4"
        style={{
          backgroundColor: "#fafafa",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4" style={{ color: "#6366f1" }} />
          <span className="text-sm font-semibold" style={{ color: "#374151" }}>
            Almost done with {currentMonthName} —
          </span>
          <span className="text-sm" style={{ color: "#6b7280" }}>
            your monthly review will be ready {format(new Date(now.getFullYear(), now.getMonth() + 1, 1), "MMMM")} 1st.
          </span>
        </div>
        <button
          onClick={() => navigate("/monthly-review")}
          className="text-sm font-semibold cursor-pointer"
          style={{ color: "#6366f1" }}
        >
          Get a preview →
        </button>
      </div>
    );
  }

  return null;
}
