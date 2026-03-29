import { useState } from "react";
import { Plus, X, Calendar, DollarSign } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Deal = {
  id: string;
  brandName: string;
  contactName: string;
  dealValue: number;
  dealType: string;
  platforms: string[];
  deadline: string;
  deadlineUrgent: boolean;
  status: string;
  payoutStatus: string;
};

const MOCK_DEALS: Deal[] = [
  { id: "1", brandName: "Notion", contactName: "Sarah Johnson", dealValue: 2500, dealType: "Sponsored Post", platforms: ["instagram", "tiktok"], deadline: "In 14 days", deadlineUrgent: false, status: "negotiating", payoutStatus: "unpaid" },
  { id: "2", brandName: "Canva", contactName: "Mike Rivera", dealValue: 1800, dealType: "Affiliate", platforms: ["youtube"], deadline: "In 30 days", deadlineUrgent: false, status: "outreach", payoutStatus: "unpaid" },
  { id: "3", brandName: "Adobe", contactName: "Lisa Chang", dealValue: 5000, dealType: "Ambassador", platforms: ["youtube", "instagram"], deadline: "In 7 days", deadlineUrgent: true, status: "contracted", payoutStatus: "unpaid" },
  { id: "4", brandName: "Skillshare", contactName: "James Wilson", dealValue: 3200, dealType: "Sponsored Post", platforms: ["instagram"], deadline: "Completed", deadlineUrgent: false, status: "delivered", payoutStatus: "unpaid" },
  { id: "5", brandName: "Monday.com", contactName: "Amy Torres", dealValue: 4000, dealType: "UGC", platforms: ["youtube"], deadline: "Received", deadlineUrgent: false, status: "paid", payoutStatus: "paid" },
];

const COLUMNS = [
  { id: "outreach", label: "Outreach", color: "#9ca3af" },
  { id: "negotiating", label: "Negotiating", color: "#f59e0b" },
  { id: "contracted", label: "Contracted", color: "#6366f1" },
  { id: "delivered", label: "Delivered", color: "#0ea5e9" },
  { id: "paid", label: "Paid", color: "#16a34a" },
];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C", youtube: "#FF0000", tiktok: "#000000", twitter: "#1DA1F2",
};

const TYPE_COLORS: Record<string, string> = {
  "Sponsored Post": "#6366f1", Affiliate: "#10b981", Ambassador: "#f59e0b", Gifted: "#ec4899", UGC: "#06b6d4",
};

export default function StudioDealsView() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const activeDeals = MOCK_DEALS.filter(d => !["paid", "delivered"].includes(d.status));
  const totalPipeline = MOCK_DEALS.reduce((s, d) => s + d.dealValue, 0);
  const earnedThisMonth = MOCK_DEALS.filter(d => d.status === "paid").reduce((s, d) => s + d.dealValue, 0);
  const awaitingPayment = MOCK_DEALS.filter(d => d.status === "delivered").reduce((s, d) => s + d.dealValue, 0);

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ border: "1px solid #e5e7eb" }}>
        {[
          { label: "ACTIVE DEALS", value: activeDeals.length.toString() },
          { label: "PIPELINE VALUE", value: `$${totalPipeline.toLocaleString()}` },
          { label: "EARNED THIS MONTH", value: `$${earnedThisMonth.toLocaleString()}` },
          { label: "AWAITING PAYMENT", value: `$${awaitingPayment.toLocaleString()}` },
        ].map((s, i) => (
          <div key={s.label} className="bg-white dark:bg-[#1e2130] p-4" style={{ borderRight: i < 3 ? "1px solid #e5e7eb" : "none" }}>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">{s.label}</p>
            <p className="text-[28px] font-medium text-[#111827] dark:text-[#f9fafb] tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="flex gap-0">
        <div className={`flex-1 grid grid-cols-1 md:grid-cols-5 overflow-x-auto transition-all`} style={{ border: "1px solid #e5e7eb" }}>
          {COLUMNS.map((col, ci) => {
            const deals = MOCK_DEALS.filter(d => d.status === col.id);
            const colTotal = deals.reduce((s, d) => s + d.dealValue, 0);
            return (
              <div key={col.id} className="bg-white dark:bg-[#1e2130] p-3 min-h-[250px]" style={{ borderRight: ci < 4 ? "1px solid #e5e7eb" : "none" }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-[12px] font-semibold text-[#111827] dark:text-[#f9fafb]">{col.label}</span>
                  <span className="text-[10px] text-[#9ca3af] ml-auto">{deals.length}</span>
                </div>
                {colTotal > 0 && <p className="text-[10px] text-[#9ca3af] mb-2" style={{ fontVariantNumeric: "tabular-nums" }}>${colTotal.toLocaleString()}</p>}
                <div className="space-y-2">
                  {deals.map(deal => (
                    <div
                      key={deal.id}
                      onClick={() => setSelectedDeal(deal)}
                      className="p-3 cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#252836] transition"
                      style={{ border: "1px solid #f0f0f0" }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-[12px] font-semibold text-[#111827] dark:text-[#f9fafb]">{deal.brandName}</p>
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-sm text-white" style={{ backgroundColor: TYPE_COLORS[deal.dealType] || "#6b7280" }}>
                          {deal.dealType}
                        </span>
                      </div>
                      <p className="text-[18px] font-medium text-[#111827] dark:text-[#f9fafb]" style={{ fontVariantNumeric: "tabular-nums" }}>${deal.dealValue.toLocaleString()}</p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-4 h-4 rounded-full bg-[#f3f3f8] dark:bg-[#252836] flex items-center justify-center text-[7px] font-semibold text-[#6b7280]">{deal.contactName[0]}</div>
                        <span className="text-[10px] text-[#6b7280]">{deal.contactName}</span>
                      </div>
                      <p className={`text-[10px] mt-1 ${deal.deadlineUrgent ? "text-[#f59e0b] font-semibold" : "text-[#9ca3af]"}`}>
                        {deal.deadline}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {deal.platforms.map(p => (
                          <div key={p} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] || "#6b7280" }} />
                        ))}
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-sm ml-auto ${
                          deal.payoutStatus === "paid" ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-[#fffbeb] text-[#b45309]"
                        }`}>
                          {deal.payoutStatus === "paid" ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button className="w-full text-[11px] text-[#9ca3af] py-2 border border-dashed border-[#e5e7eb] hover:text-[#374151] transition">
                    + Add Deal
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deal Detail Panel */}
      <Sheet open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <SheetContent side="right" className="w-[380px] p-0 border-l border-[#e5e7eb] dark:border-[#2d3148] shadow-none rounded-none">
          {selectedDeal && (
            <div className="h-full flex flex-col">
              <SheetHeader className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
                <SheetTitle className="text-[18px] font-semibold text-[#111827] dark:text-[#f9fafb]">{selectedDeal.brandName}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Value</p>
                  <p className="text-[24px] font-medium text-[#111827] dark:text-[#f9fafb]" style={{ fontVariantNumeric: "tabular-nums" }}>${selectedDeal.dealValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Point of Contact</p>
                  <div className="flex items-center gap-2 p-3" style={{ border: "1px solid #f0f0f0" }}>
                    <div className="w-7 h-7 rounded-full bg-[#f3f3f8] dark:bg-[#252836] flex items-center justify-center text-[10px] font-semibold text-[#6b7280]">{selectedDeal.contactName[0]}</div>
                    <div>
                      <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb]">{selectedDeal.contactName}</p>
                      <p className="text-[10px] text-[#9ca3af]">Brand Contact</p>
                    </div>
                  </div>
                  <button className="text-[11px] text-[#6366f1] font-medium mt-1">View in Contacts</button>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Type</p>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm text-white" style={{ backgroundColor: TYPE_COLORS[selectedDeal.dealType] || "#6b7280" }}>
                    {selectedDeal.dealType}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Platforms</p>
                  <div className="flex gap-2">
                    {selectedDeal.platforms.map(p => (
                      <div key={p} className="flex items-center gap-1 text-[12px] text-[#374151] dark:text-[#e5e7eb]">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] }} />
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Deadline</p>
                  <p className="text-[13px] text-[#111827] dark:text-[#f9fafb]">{selectedDeal.deadline}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Deliverables</p>
                  <div className="p-3 text-[13px] text-[#374151] dark:text-[#e5e7eb]" style={{ border: "1px solid #f0f0f0" }}>
                    1x Instagram Reel, 1x Story set, 1x TikTok video
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Notes</p>
                  <div className="p-3 text-[13px] text-[#374151] dark:text-[#e5e7eb]" style={{ border: "1px solid #f0f0f0" }}>
                    Waiting for creative brief. Follow up next week.
                  </div>
                </div>
                {selectedDeal.payoutStatus !== "paid" && (
                  <button className="w-full flex items-center justify-center gap-2 bg-[#111827] dark:bg-[#f9fafb] text-white dark:text-[#111827] px-4 py-2.5 text-[12px] font-medium transition hover:opacity-90">
                    <DollarSign className="w-3.5 h-3.5" /> Mark as Paid
                  </button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
