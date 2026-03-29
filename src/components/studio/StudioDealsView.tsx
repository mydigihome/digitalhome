import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

type Deal = {
  id: string; brandName: string; contactName: string; dealValue: number; dealType: string;
  platforms: string[]; deadline: string; deadlineUrgent: boolean; status: string; payoutStatus: string;
};

const INITIAL_DEALS: Deal[] = [
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

const PLATFORM_COLORS: Record<string, string> = { instagram: "#E1306C", youtube: "#FF0000", tiktok: "#000000", twitter: "#1DA1F2" };
const TYPE_COLORS: Record<string, string> = { "Sponsored Post": "#6366f1", Affiliate: "#10b981", Ambassador: "#f59e0b", Gifted: "#ec4899", UGC: "#06b6d4" };

export default function StudioDealsView() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [newDeal, setNewDeal] = useState({ brandName: "", contactName: "", dealValue: 0, dealType: "Sponsored Post", platforms: [] as string[], deliverables: "", deadline: "", notes: "" });

  const activeDeals = deals.filter(d => !["paid", "delivered"].includes(d.status));
  const totalPipeline = deals.reduce((s, d) => s + d.dealValue, 0);
  const earnedThisMonth = deals.filter(d => d.status === "paid").reduce((s, d) => s + d.dealValue, 0);
  const awaitingPayment = deals.filter(d => d.status === "delivered").reduce((s, d) => s + d.dealValue, 0);

  const markAsPaid = (id: string) => {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, payoutStatus: "paid", status: "paid" } : d));
    setSelectedDeal(null);
    toast.success("Deal marked as paid");
  };

  const addDeal = () => {
    if (!newDeal.brandName.trim()) return;
    const deal: Deal = {
      id: Date.now().toString(), brandName: newDeal.brandName, contactName: newDeal.contactName,
      dealValue: newDeal.dealValue, dealType: newDeal.dealType, platforms: newDeal.platforms,
      deadline: newDeal.deadline || "TBD", deadlineUrgent: false, status: "outreach", payoutStatus: "unpaid",
    };
    setDeals(prev => [...prev, deal]);
    setShowNewDeal(false);
    setNewDeal({ brandName: "", contactName: "", dealValue: 0, dealType: "Sponsored Post", platforms: [], deliverables: "", deadline: "", notes: "" });
    toast.success("Deal added");
  };

  const toggleNewPlatform = (p: string) => setNewDeal(prev => ({ ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p] }));

  return (
    <div className="space-y-3 max-w-[1400px] mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        {[
          { label: "ACTIVE DEALS", value: activeDeals.length.toString() },
          { label: "PIPELINE VALUE", value: `$${totalPipeline.toLocaleString()}` },
          { label: "EARNED THIS MONTH", value: `$${earnedThisMonth.toLocaleString()}` },
          { label: "AWAITING PAYMENT", value: `$${awaitingPayment.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">{s.label}</p>
            <p className="text-[28px] font-medium text-[#111827] dark:text-[#f9fafb] tracking-tight leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Add Deal Button */}
      <div className="flex justify-end">
        <button onClick={() => setShowNewDeal(true)} className="text-[12px] font-medium text-[#6366f1]">+ Add Deal</button>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-1 overflow-x-auto">
        {COLUMNS.map(col => {
          const colDeals = deals.filter(d => d.status === col.id);
          const colTotal = colDeals.reduce((s, d) => s + d.dealValue, 0);
          return (
            <div key={col.id} className="bg-white dark:bg-[#0f1117] rounded-lg border border-[#e5e7eb] dark:border-[#1f2937] p-3 min-h-[250px]">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                <span className="text-[12px] font-semibold text-[#111827] dark:text-[#f9fafb]">{col.label}</span>
                <span className="text-[10px] text-[#9ca3af] ml-auto">{colDeals.length}</span>
              </div>
              {colTotal > 0 && <p className="text-[10px] text-[#9ca3af] mb-2" style={{ fontVariantNumeric: "tabular-nums" }}>${colTotal.toLocaleString()}</p>}
              <div className="space-y-2">
                {colDeals.map(deal => (
                  <div key={deal.id} onClick={() => setSelectedDeal(deal)} className="p-3 cursor-pointer hover:bg-[#fafafa] dark:hover:bg-[#0d1017] transition rounded-lg border border-[#f0f0f0] dark:border-[#1a1d27]">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-[12px] font-semibold text-[#111827] dark:text-[#f9fafb]">{deal.brandName}</p>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: TYPE_COLORS[deal.dealType] || "#6b7280" }}>{deal.dealType}</span>
                    </div>
                    <p className="text-[18px] font-medium text-[#111827] dark:text-[#f9fafb]" style={{ fontVariantNumeric: "tabular-nums" }}>${deal.dealValue.toLocaleString()}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-4 h-4 rounded-full bg-[#f3f3f8] dark:bg-[#1f2937] flex items-center justify-center text-[7px] font-semibold text-[#6b7280]">{deal.contactName[0]}</div>
                      <span className="text-[10px] text-[#6b7280] dark:text-[#9ca3af]">{deal.contactName}</span>
                    </div>
                    <p className={`text-[10px] mt-1 ${deal.deadlineUrgent ? "text-[#f59e0b] font-semibold" : "text-[#9ca3af]"}`}>{deal.deadline}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {deal.platforms.map(p => <div key={p} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PLATFORM_COLORS[p] || "#6b7280" }} />)}
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ml-auto ${deal.payoutStatus === "paid" ? "bg-[#f0fdf4] text-[#16a34a] dark:bg-[#16a34a]/20" : "bg-[#fffbeb] text-[#b45309] dark:bg-[#b45309]/20"}`}>
                        {deal.payoutStatus === "paid" ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </div>
                ))}
                <button onClick={() => setShowNewDeal(true)} className="w-full text-[11px] text-[#9ca3af] py-2 border border-dashed border-[#e5e7eb] dark:border-[#1f2937] rounded-md hover:text-[#374151] transition">+ Add Deal</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal Detail Panel */}
      <Sheet open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <SheetContent side="right" className="w-full sm:w-[380px] p-0 border-l border-[#e5e7eb] dark:border-[#1f2937] shadow-none">
          {selectedDeal && (
            <div className="h-full flex flex-col">
              <SheetHeader className="px-5 pt-5 pb-4 border-b border-[#e5e7eb] dark:border-[#1f2937]">
                <SheetTitle className="text-[18px] font-semibold text-[#111827] dark:text-[#f9fafb]">{selectedDeal.brandName}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Value</p>
                  <p className="text-[24px] font-medium text-[#111827] dark:text-[#f9fafb]" style={{ fontVariantNumeric: "tabular-nums" }}>${selectedDeal.dealValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Point of Contact</p>
                  <div className="flex items-center gap-2 p-3 rounded-lg border border-[#f0f0f0] dark:border-[#1a1d27]">
                    <div className="w-7 h-7 rounded-full bg-[#f3f3f8] dark:bg-[#1f2937] flex items-center justify-center text-[10px] font-semibold text-[#6b7280]">{selectedDeal.contactName[0]}</div>
                    <div>
                      <p className="text-[13px] font-medium text-[#111827] dark:text-[#f9fafb]">{selectedDeal.contactName}</p>
                      <p className="text-[10px] text-[#9ca3af]">Brand Contact</p>
                    </div>
                  </div>
                  <button className="text-[11px] text-[#6366f1] font-medium mt-1">View in Contacts</button>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Type</p>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: TYPE_COLORS[selectedDeal.dealType] || "#6b7280" }}>{selectedDeal.dealType}</span>
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
                  <div className="p-3 text-[13px] text-[#374151] dark:text-[#e5e7eb] rounded-lg border border-[#f0f0f0] dark:border-[#1a1d27]">
                    1x Instagram Reel, 1x Story set, 1x TikTok video
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Notes</p>
                  <div className="p-3 text-[13px] text-[#374151] dark:text-[#e5e7eb] rounded-lg border border-[#f0f0f0] dark:border-[#1a1d27]">
                    Waiting for creative brief. Follow up next week.
                  </div>
                </div>
                {selectedDeal.payoutStatus !== "paid" && (
                  <button onClick={() => markAsPaid(selectedDeal.id)} className="w-full flex items-center justify-center gap-2 bg-[#111827] dark:bg-[#f9fafb] text-white dark:text-[#111827] px-4 py-2.5 text-[12px] font-medium rounded-md transition hover:opacity-90">
                    <DollarSign className="w-3.5 h-3.5" /> Mark as Paid
                  </button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* New Deal Panel */}
      <Sheet open={showNewDeal} onOpenChange={setShowNewDeal}>
        <SheetContent side="right" className="w-full sm:w-[380px] p-0 border-l border-[#e5e7eb] dark:border-[#1f2937] shadow-none">
          <div className="h-full flex flex-col">
            <SheetHeader className="px-5 pt-5 pb-4 border-b border-[#e5e7eb] dark:border-[#1f2937]">
              <SheetTitle className="text-[15px] font-semibold text-[#111827] dark:text-[#f9fafb]">New Deal</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Brand Name</p>
                <input className="w-full text-[13px] border border-[#e5e7eb] dark:border-[#1f2937] bg-transparent dark:text-[#f9fafb] px-3 py-2 rounded-md outline-none focus:border-[#6366f1]" value={newDeal.brandName} onChange={e => setNewDeal(p => ({ ...p, brandName: e.target.value }))} />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Contact Name</p>
                <input className="w-full text-[13px] border border-[#e5e7eb] dark:border-[#1f2937] bg-transparent dark:text-[#f9fafb] px-3 py-2 rounded-md outline-none focus:border-[#6366f1]" value={newDeal.contactName} onChange={e => setNewDeal(p => ({ ...p, contactName: e.target.value }))} />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Deal Value ($)</p>
                <input type="number" className="w-full text-[13px] border border-[#e5e7eb] dark:border-[#1f2937] bg-transparent dark:text-[#f9fafb] px-3 py-2 rounded-md outline-none focus:border-[#6366f1]" value={newDeal.dealValue || ""} onChange={e => setNewDeal(p => ({ ...p, dealValue: Number(e.target.value) }))} />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Deal Type</p>
                <select className="w-full text-[13px] border border-[#e5e7eb] dark:border-[#1f2937] bg-transparent dark:text-[#f9fafb] px-3 py-2 rounded-md outline-none" value={newDeal.dealType} onChange={e => setNewDeal(p => ({ ...p, dealType: e.target.value }))}>
                  {["Sponsored Post", "Affiliate", "Ambassador", "Gifted", "UGC"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Platforms</p>
                <div className="flex gap-1.5">
                  {Object.entries(PLATFORM_COLORS).map(([p, color]) => (
                    <button key={p} onClick={() => toggleNewPlatform(p)} className={`w-7 h-7 rounded-md flex items-center justify-center transition ${newDeal.platforms.includes(p) ? "ring-2 ring-[#6366f1]" : "bg-[#f5f5f5] dark:bg-[#1f2937]"}`}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Deliverables</p>
                <textarea className="w-full text-[13px] border border-[#e5e7eb] dark:border-[#1f2937] bg-transparent dark:text-[#f9fafb] px-3 py-2 rounded-md outline-none resize-none" rows={2} value={newDeal.deliverables} onChange={e => setNewDeal(p => ({ ...p, deliverables: e.target.value }))} />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#9ca3af] mb-1">Notes</p>
                <textarea className="w-full text-[13px] border border-[#e5e7eb] dark:border-[#1f2937] bg-transparent dark:text-[#f9fafb] px-3 py-2 rounded-md outline-none resize-none" rows={2} value={newDeal.notes} onChange={e => setNewDeal(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="shrink-0 px-5 py-4 border-t border-[#e5e7eb] dark:border-[#1f2937]">
              <button onClick={addDeal} className="w-full text-[12px] font-medium bg-[#111827] dark:bg-[#f9fafb] text-white dark:text-[#111827] py-2.5 rounded-md hover:opacity-90 transition">Save Deal</button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
