import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { usePremiumStatus } from "@/components/PremiumGate";
import { useNavigate } from "react-router-dom";

const CARD_OPTIONS = [
  { id: "subscriptions", icon: "repeat", title: "Subscription Tracker", desc: "Monitor recurring charges and identify unused services.", plaid: true },
  { id: "net-worth-history", icon: "trending_up", title: "Net Worth History", desc: "Visualize your total wealth over the past 12 months.", plaid: true },
  { id: "investment-portfolio", icon: "account_balance", title: "Investment Portfolio", desc: "Track holdings across connected brokerage accounts.", plaid: true },
  { id: "tax-estimate", icon: "receipt_long", title: "Tax Estimate", desc: "Forecast quarterly tax obligations based on income.", plaid: true },
  { id: "merchant-spending", icon: "storefront", title: "Merchant Spending", desc: "See your highest-spend merchants each month.", plaid: true },
  { id: "category-trends", icon: "bar_chart", title: "Category Trends", desc: "Compare spending categories month over month.", plaid: true },
  { id: "cashflow-calendar", icon: "calendar_month", title: "Cash Flow Calendar", desc: "Map daily income and expenses across the month.", plaid: true },
  { id: "refund-tracker", icon: "currency_exchange", title: "Refund Tracker", desc: "Monitor pending refunds from recent transactions.", plaid: true },
  { id: "large-transactions", icon: "notifications", title: "Large Transaction Alerts", desc: "Flag transactions above a threshold you define.", plaid: true },
  { id: "savings-opportunities", icon: "savings", title: "Savings Opportunities", desc: "Surface subscriptions and patterns worth reviewing.", plaid: true },
];

interface Props {
  open: boolean;
  onClose: () => void;
  existingCardIds: string[];
  onAddCards: (ids: string[]) => void;
  plaidConnected?: boolean;
}

export default function TrackFinanceModal({ open, onClose, existingCardIds, onAddCards, plaidConnected = false }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { isPremium } = usePremiumStatus();
  const navigate = useNavigate();

  if (!open) return null;

  const toggle = (id: string) => {
    if (existingCardIds.includes(id)) return;
    if (!plaidConnected) {
      toast.info("Connect your bank account first to enable this card");
      return;
    }
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    if (!isPremium) {
      onClose();
      navigate("/settings?tab=billing");
      toast.info("Upgrade to add premium financial cards");
      return;
    }
    onAddCards(Array.from(selected));
    setSelected(new Set());
    onClose();
    toast.success(`${selected.size} card${selected.size > 1 ? "s" : ""} added to your Money tab`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[560px] mx-4 mt-[6vh] bg-white rounded-[24px] p-8 shadow-2xl"
        style={{ maxHeight: "80vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="font-bold text-xl text-[#111827]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Add Financial Cards</h2>
            <p className="text-sm text-[#6b7280] mt-1">Select insight cards to add to your Money tab.</p>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer p-1">
            <X className="w-5 h-5 text-[#9ca3af]" />
          </button>
        </div>

        {/* Plaid banner */}
        {!plaidConnected && (
          <div className="bg-[#fefce8] border border-[#fde68a] rounded-[12px] px-4 py-3 mb-5 mt-4">
            <p className="text-sm text-[#92400e] font-medium">
              Connect your bank account to unlock data-powered cards.{" "}
              <button className="text-[#6366f1] font-semibold underline bg-transparent border-none cursor-pointer text-sm">
                Connect Bank
              </button>
            </p>
          </div>
        )}

        {/* Card list */}
        <div className="space-y-2 mt-4">
          {CARD_OPTIONS.map(card => {
            const isExisting = existingCardIds.includes(card.id);
            const isSelected = selected.has(card.id);
            const isLocked = card.plaid && !plaidConnected && !isExisting;

            return (
              <div
                key={card.id}
                onClick={() => toggle(card.id)}
                className={`flex items-center gap-4 px-5 py-4 rounded-[16px] border transition-all duration-150 ${
                  isExisting
                    ? "opacity-50 cursor-not-allowed border-[#e5e7eb] bg-white"
                    : isSelected
                    ? "border-[#6366f1] bg-[#eef2ff] cursor-pointer"
                    : "border-[#e5e7eb] bg-white cursor-pointer hover:border-[#6366f1] hover:bg-[#fafafa]"
                }`}
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-[10px] bg-[#f3f4f6] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-lg text-[#6366f1]">{card.icon}</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#111827]">{card.title}</div>
                  <div className="text-xs text-[#6b7280] mt-0.5">{card.desc}</div>
                </div>

                {/* Right indicator */}
                <div className="flex-shrink-0">
                  {isExisting ? (
                    <span className="text-[#6366f1] font-bold text-sm"></span>
                  ) : isLocked ? (
                    <span className="material-symbols-outlined text-[#d1d5db] text-lg">lock</span>
                  ) : (
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isSelected ? "bg-[#6366f1] border-[#6366f1]" : "border-[#d1d5db]"
                    }`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 mt-6">
          <button onClick={onClose} className="text-[#6b7280] text-sm font-medium bg-transparent border-none cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selected.size === 0}
            className={`rounded-[12px] px-6 py-2.5 font-semibold text-sm border-none cursor-pointer transition-colors ${
              selected.size > 0
                ? "bg-[#6366f1] hover:bg-[#4f46e5] text-white"
                : "bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
            }`}
          >
            {selected.size > 0 ? `Add ${selected.size} Card${selected.size > 1 ? "s" : ""}` : "Add Selected"}
          </button>
        </div>
      </div>
    </div>
  );
}
