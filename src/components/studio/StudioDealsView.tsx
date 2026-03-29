import { useState } from "react";
import { Plus, GripVertical } from "lucide-react";

type Deal = {
  id: string;
  brandName: string;
  contactName: string;
  dealValue: number;
  dealType: string;
  platforms: string[];
  deadline: string;
  status: string;
};

const MOCK_DEALS: Deal[] = [
  { id: "1", brandName: "Notion", contactName: "Sarah K.", dealValue: 2500, dealType: "Sponsored Post", platforms: ["instagram", "tiktok"], deadline: "In 14 days", status: "negotiating" },
  { id: "2", brandName: "Canva", contactName: "Mike R.", dealValue: 1800, dealType: "Affiliate", platforms: ["youtube"], deadline: "In 30 days", status: "outreach" },
  { id: "3", brandName: "Skillshare", contactName: "Lisa M.", dealValue: 5000, dealType: "Ambassador", platforms: ["youtube", "instagram"], deadline: "In 7 days", status: "contracted" },
  { id: "4", brandName: "Adobe", contactName: "James W.", dealValue: 3200, dealType: "Sponsored Post", platforms: ["instagram"], deadline: "Completed", status: "delivered" },
  { id: "5", brandName: "Monday.com", contactName: "Amy T.", dealValue: 4000, dealType: "Sponsored Post", platforms: ["youtube"], deadline: "Received", status: "paid" },
];

const COLUMNS = [
  { id: "outreach", label: "Outreach", color: "#9ca3af" },
  { id: "negotiating", label: "Negotiating", color: "#f59e0b" },
  { id: "contracted", label: "Contracted", color: "#6366f1" },
  { id: "delivered", label: "Delivered", color: "#0ea5e9" },
  { id: "paid", label: "Paid", color: "#16a34a" },
];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C", youtube: "#FF0000", tiktok: "#000000",
  twitter: "#1DA1F2", facebook: "#1877F2",
};

const TYPE_COLORS: Record<string, string> = {
  "Sponsored Post": "#6366f1",
  "Affiliate": "#10b981",
  "Ambassador": "#f59e0b",
  "Gifted": "#ec4899",
};

export default function StudioDealsView() {
  const totalPipeline = MOCK_DEALS.reduce((s, d) => s + d.dealValue, 0);
  const activeDeals = MOCK_DEALS.filter(d => !["paid", "delivered"].includes(d.status)).length;
  const earnedThisMonth = MOCK_DEALS.filter(d => d.status === "paid").reduce((s, d) => s + d.dealValue, 0);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "ACTIVE DEALS", value: activeDeals.toString() },
          { label: "PIPELINE VALUE", value: `$${totalPipeline.toLocaleString()}` },
          { label: "EARNED THIS MONTH", value: `$${earnedThisMonth.toLocaleString()}` },
          { label: "AVG DEAL", value: `$${Math.round(totalPipeline / MOCK_DEALS.length).toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#1e2130] rounded-[20px] p-5 border border-[#f0f0f5] dark:border-[#2d3148]">
            <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] font-semibold mb-1">{s.label}</p>
            <p className="text-2xl font-extrabold text-[#111827] dark:text-[#f9fafb]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto">
        {COLUMNS.map(col => {
          const deals = MOCK_DEALS.filter(d => d.status === col.id);
          return (
            <div key={col.id} className="bg-[#f9fafb] dark:bg-[#252836] rounded-[20px] p-4 min-h-[250px] min-w-[200px]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-sm font-bold text-[#111827] dark:text-[#f9fafb]">{col.label}</span>
                <span className="text-xs bg-white dark:bg-[#1e2130] px-2 py-0.5 rounded-full text-[#6b7280] font-semibold ml-auto">{deals.length}</span>
              </div>

              <div className="space-y-3">
                {deals.map(deal => (
                  <div key={deal.id} className="bg-white dark:bg-[#1e2130] rounded-[16px] p-4 shadow-sm border border-[#f0f0f5] dark:border-[#2d3148]">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-bold text-[#111827] dark:text-[#f9fafb]">{deal.brandName}</p>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: TYPE_COLORS[deal.dealType] || "#6b7280" }}>
                        {deal.dealType}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-[#6366f1]">${deal.dealValue.toLocaleString()}</p>
                    <p className={`text-[11px] mt-1 font-medium ${deal.deadline.includes("7 days") ? "text-amber-600 dark:text-amber-400" : "text-[#9ca3af]"}`}>
                      {deal.deadline}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      {deal.platforms.map(p => (
                        <div key={p} className="w-4 h-4 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] || "#6b7280" }} title={p} />
                      ))}
                    </div>
                    <p className="text-[10px] text-[#9ca3af] mt-1">{deal.contactName}</p>
                  </div>
                ))}

                <button className="w-full flex items-center justify-center gap-1 text-xs text-[#6b7280] dark:text-[#9ca3af] py-2 rounded-xl border border-dashed border-[#e5e7eb] dark:border-[#2d3148] transition hover:text-[#374151]">
                  <Plus className="w-3 h-3" /> Add Deal
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
