import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMonthlyReviews } from "@/hooks/useMonthlyReviews";

export default function MonthlyReviewBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: reviews = [] } = useMonthlyReviews();

  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const isLastThreeDays = dayOfMonth >= lastDay - 2;
  const isFirstSevenDays = dayOfMonth <= 7;
  const monthName = today.toLocaleString("default", { month: "long" });
  const prevMonthName = new Date(today.getFullYear(), today.getMonth() - 1).toLocaleString("default", { month: "long" });

  const prevMonthReview = reviews.find((r: any) => {
    const rm = (r.review_month || "").toLowerCase();
    return rm.includes(prevMonthName.toLowerCase());
  });
  const bannerApproved = !!prevMonthReview;

  // STATE A: last 3 days of current month
  if (isLastThreeDays) {
    return (
      <div
        className="flex items-center justify-between mb-4 px-5 py-3 rounded-[16px]"
        style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
      >
        <p className="text-sm">
          <span className="font-semibold" style={{ color: "#374151" }}>
            Almost done with {monthName} —
          </span>
          <span style={{ color: "#6b7280" }}> your review will be ready on the 1st.</span>
        </p>
        <button
          onClick={() => navigate("/monthly-review")}
          className="text-sm font-semibold shrink-0 ml-3"
          style={{ color: "#6366f1" }}
        >
          Preview →
        </button>
      </div>
    );
  }

  // STATE B: first 7 days, no approved review
  if (isFirstSevenDays && !bannerApproved) {
    return (
      <div
        onClick={() => navigate("/monthly-review")}
        className="flex items-center justify-between mb-4 px-5 py-3 rounded-[16px] cursor-pointer"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(99,102,241,0.2)",
          boxShadow: "0 2px 12px rgba(99,102,241,0.08)",
        }}
      >
        <div className="flex items-center text-sm">
          <span
            className="w-2 h-2 rounded-full mr-3 shrink-0 animate-pulse"
            style={{ background: "#6366f1" }}
          />
          <span className="font-semibold" style={{ color: "#111827" }}>
            Your {prevMonthName} review is ready.
          </span>
          <span className="ml-1" style={{ color: "#6366f1" }}>
            See how you did →
          </span>
        </div>
        <button
          className="shrink-0 ml-3 px-4 py-1.5 rounded-full text-xs font-semibold text-white"
          style={{ background: "#6366f1" }}
        >
          View Review
        </button>
      </div>
    );
  }

  // STATE C: first 7 days, approved
  if (isFirstSevenDays && bannerApproved) {
    return (
      <div
        className="flex items-center justify-between mb-4 px-5 py-3 rounded-[16px]"
        style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
      >
        <div className="flex items-center text-sm">
          <span className="mr-2" style={{ color: "#16a34a" }}>✓</span>
          <span className="font-semibold" style={{ color: "#15803d" }}>
            {prevMonthName} review approved.
          </span>
          <span className="ml-1" style={{ color: "#6b7280" }}>
            Saved to your archive.
          </span>
        </div>
        <button
          onClick={() => navigate("/monthly-review?mode=read")}
          className="text-xs font-semibold shrink-0 ml-3"
          style={{ color: "#16a34a" }}
        >
          View
        </button>
      </div>
    );
  }

  return null;
}
