import { useState } from "react";
import { Plus, X, Calendar, DollarSign } from "lucide-react";

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
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "ACTIVE DEALS", value: activeDeals.length.toString() },
          { label: "PIPELINE VALUE", value: `$${totalPipeline.toLocaleString()}` },
          { label: "EARNED THIS MONTH", value: `$${earnedThisMonth.toLocaleString()}` },
          { label: "AWAITING PAYMENT", value: `$${awaitingPayment.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)]">
            <p className="text-[2rem] font-extrabold tracking-tighter text-[#111827] dark:text-[#f9fafb]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {s.value}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-[#9ca3af] dark:text-[#6b7280]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline + Detail Panel */}
      <div className="flex gap-4">
        <div className={`flex-1 grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto transition-all ${selectedDeal ? "md:grid-cols-3 lg:grid-cols-4" : ""}`}>
          {COLUMNS.map(col => {
            const deals = MOCK_DEALS.filter(d => d.status === col.id);
            const colTotal = deals.reduce((s, d) => s + d.dealValue, 0);
            return (
              <div key={col.id} className="bg-[#f9fafb] dark:bg-[#252836] rounded-[20px] p-4 min-h-[250px] min-w-[180px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-bold text-[#111827] dark:text-[#f9fafb]">{col.label}</span>
                  <span className="text-xs bg-white dark:bg-[#1e2130] px-2 py-0.5 rounded-full text-[#6b7280] font-semibold ml-auto">{deals.length}</span>
                </div>
                {colTotal > 0 && (
                  <p className="text-[10px] text-[#9ca3af] mb-2">${colTotal.toLocaleString()}</p>
                )}
                <div className="space-y-3">
                  {deals.map(deal => (
                    <div
                      key={deal.id}
                      onClick={() => setSelectedDeal(deal)}
                      className="bg-white dark:bg-[#1e2130] rounded-[16px] p-4 shadow-sm border border-[#f0f0f5] dark:border-[#2d3148] cursor-pointer hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-bold text-[#111827] dark:text-[#f9fafb]">{deal.brandName}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: TYPE_COLORS[deal.dealType] || "#6b7280" }}>
                          {deal.dealType}
                        </span>
                      </div>
                      <p className="text-lg font-extrabold text-[#6366f1]">${deal.dealValue.toLocaleString()}</p>

                      {/* Contact */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-5 h-5 rounded-full bg-[#e1e0ff] dark:bg-[#2d2b4e] flex items-center justify-center text-[8px] font-bold text-[#4648d4] dark:text-[#a5b4fc]">
                          {deal.contactName[0]}
                        </div>
                        <span className="text-[10px] text-[#374151] dark:text-[#e5e7eb] font-medium">{deal.contactName}</span>
                      </div>

                      <p className={`text-[11px] mt-1 font-medium ${deal.deadlineUrgent ? "text-[#f59e0b] font-bold" : "text-[#9ca3af]"}`}>
                        <Calendar className="w-3 h-3 inline mr-0.5" />{deal.deadline}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {deal.platforms.map(p => (
                          <div key={p} className="w-3 h-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] || "#6b7280" }} title={p} />
                        ))}
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto ${
                          deal.payoutStatus === "paid"
                            ? "bg-[#f0fdf4] dark:bg-[#1a2e1e] text-[#16a34a]"
                            : "bg-[#fffbeb] dark:bg-[#2d2a1e] text-[#b45309]"
                        }`}>
                          {deal.payoutStatus === "paid" ? "Paid ✓" : "Unpaid"}
                        </span>
                      </div>
                    </div>
                  ))}
                  <button className="w-full flex items-center justify-center gap-1 text-xs text-[#9ca3af] py-2 rounded-xl border border-dashed border-[#e5e7eb] dark:border-[#2d3148] hover:text-[#374151] transition">
                    <Plus className="w-3 h-3" /> Add Deal
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Deal Detail Panel */}
        {selectedDeal && (
          <div className="w-[380px] shrink-0 bg-white dark:bg-[#1e2130] rounded-[24px] p-5 border border-[#f0f0f5] dark:border-[#2d3148] shadow-[0_4px_20px_rgba(70,69,84,0.06)] hidden md:block overflow-y-auto max-h-[70vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-xl text-[#111827] dark:text-[#f9fafb]">{selectedDeal.brandName}</h3>
              <button onClick={() => setSelectedDeal(null)} className="text-[#9ca3af] hover:text-[#374151] transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1">Value</p>
                <p className="text-2xl font-extrabold text-[#6366f1]">${selectedDeal.dealValue.toLocaleString()}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1">Point of Contact</p>
                <div className="flex items-center gap-2 p-3 bg-[#f9fafb] dark:bg-[#252836] rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#e1e0ff] dark:bg-[#2d2b4e] flex items-center justify-center text-xs font-bold text-[#4648d4] dark:text-[#a5b4fc]">
                    {selectedDeal.contactName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827] dark:text-[#f9fafb]">{selectedDeal.contactName}</p>
                    <p className="text-xs text-[#9ca3af]">Brand Contact</p>
                  </div>
                </div>
                <button className="text-xs text-[#6366f1] font-semibold mt-1">View in Contacts →</button>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1">Type</p>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: TYPE_COLORS[selectedDeal.dealType] || "#6b7280" }}>
                  {selectedDeal.dealType}
                </span>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1">Platforms</p>
                <div className="flex gap-2">
                  {selectedDeal.platforms.map(p => (
                    <div key={p} className="flex items-center gap-1 text-xs text-[#374151] dark:text-[#e5e7eb]">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] }} />
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1">Deadline</p>
                <p className="text-sm text-[#111827] dark:text-[#f9fafb]">{selectedDeal.deadline}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1">Deliverables</p>
                <div className="p-3 bg-[#f9fafb] dark:bg-[#252836] rounded-xl text-sm text-[#374151] dark:text-[#e5e7eb]">
                  1x Instagram Reel, 1x Story set, 1x TikTok video
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-1">Notes</p>
                <div className="p-3 bg-[#f9fafb] dark:bg-[#252836] rounded-xl text-sm text-[#374151] dark:text-[#e5e7eb]">
                  Waiting for creative brief. Follow up next week.
                </div>
              </div>

              {selectedDeal.payoutStatus !== "paid" && (
                <button className="w-full flex items-center justify-center gap-2 bg-[#16a34a] text-white rounded-[12px] px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition">
                  <DollarSign className="w-4 h-4" /> Mark as Paid
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
