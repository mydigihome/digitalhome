import { useState } from "react";
import { X, Lock } from "lucide-react";
import { toast } from "sonner";

const CARD_OPTIONS = [
  { id: "subscriptions", icon: "📺", iconBg: "#ffe4e6", title: "Subscription Tracker", desc: "All recurring charges — cancel with one click", plaid: true },
  { id: "net-worth-history", icon: "📈", iconBg: "#dcfce7", title: "Net Worth History", desc: "12-month chart of your total wealth growth", plaid: true },
  { id: "investment-portfolio", icon: "💼", iconBg: "#e1e0ff", title: "Investment Portfolio", desc: "Stocks, ETFs and brokerage accounts", plaid: true },
  { id: "tax-estimate", icon: "🧾", iconBg: "#fffbeb", title: "Tax Estimate", desc: "Quarterly estimated taxes based on income", plaid: true },
  { id: "merchant-spending", icon: "🏪", iconBg: "#fdf2f8", title: "Merchant Spending", desc: "Top 10 merchants you spend at each month", plaid: true },
  { id: "category-trends", icon: "📊", iconBg: "#f0f0ff", title: "Category Trends", desc: "Month-over-month spending by category", plaid: true },
  { id: "cashflow-calendar", icon: "📅", iconBg: "#dcfce7", title: "Cash Flow Calendar", desc: "Money in vs out mapped to each day", plaid: true },
  { id: "refund-tracker", icon: "🔄", iconBg: "#ffe4e6", title: "Refund Tracker", desc: "Pending refunds detected from transactions", plaid: true },
  { id: "large-transactions", icon: "🚨", iconBg: "#fffbeb", title: "Large Transaction Alerts", desc: "Any transaction over your set threshold", plaid: true },
  { id: "savings-opportunities", icon: "💡", iconBg: "#e1e0ff", title: "Savings Opportunities", desc: "AI finds unused subscriptions and waste", plaid: true },
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

  if (!open) return null;

  const toggle = (id: string) => {
    if (existingCardIds.includes(id)) return;
    if (!plaidConnected) {
      toast.info("Connect Plaid first to enable this card");
      return;
    }
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    onAddCards(Array.from(selected));
    setSelected(new Set());
    onClose();
    toast.success(`${selected.size} card${selected.size > 1 ? "s" : ""} added to your Money tab`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div
        className="w-full max-w-[640px] mx-4 mt-[6vh]"
        style={{ backgroundColor: "#ffffff", borderRadius: "32px", padding: "32px", boxShadow: "0 25px 60px rgba(0,0,0,0.15)", maxHeight: "80vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "24px", color: "#1a1c1f" }}>Track Finance</h2>
            <p style={{ fontSize: "14px", color: "#767586", marginTop: "4px" }}>Add new financial insight cards to your dashboard</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X className="w-5 h-5" style={{ color: "#767586" }} />
          </button>
        </div>

        {!plaidConnected && (
          <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: "16px", padding: "12px 16px", marginBottom: "24px" }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#92400e" }}>⚡ Connect Plaid to unlock all cards automatically</span>
              <button style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)", color: "white", borderRadius: "9999px", padding: "4px 12px", fontSize: "11px", fontWeight: 700, border: "none", cursor: "pointer" }}>
                Connect Bank
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          {CARD_OPTIONS.map(card => {
            const isExisting = existingCardIds.includes(card.id);
            const isSelected = selected.has(card.id);
            return (
              <div
                key={card.id}
                onClick={() => toggle(card.id)}
                className="relative cursor-pointer"
                style={{
                  backgroundColor: isSelected ? "#f0f0ff" : "#f3f3f8",
                  borderRadius: "20px", padding: "16px",
                  border: isSelected ? "1px solid #4648d4" : isExisting ? "1px solid #e0e0e0" : "1px solid transparent",
                  opacity: isExisting ? 0.5 : 1,
                  transition: "all 150ms",
                }}
              >
                {isExisting && <div style={{ position: "absolute", top: "12px", right: "12px", color: "#4648d4", fontSize: "14px" }}>✓</div>}
                {!plaidConnected && !isExisting && <Lock className="absolute top-3 right-3 w-3.5 h-3.5" style={{ color: "#c7c4d7" }} />}
                <div style={{ backgroundColor: card.iconBg, borderRadius: "12px", padding: "8px", width: "fit-content", fontSize: "20px", marginBottom: "8px" }}>
                  {card.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "#1a1c1f" }}>{card.title}</div>
                <div style={{ fontSize: "12px", color: "#767586", marginTop: "2px" }}>{card.desc}</div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleAdd}
          disabled={selected.size === 0}
          style={{
            width: "100%", marginTop: "20px", padding: "12px",
            background: selected.size > 0 ? "linear-gradient(135deg, #4648d4, #6063ee)" : "#e0e0e0",
            color: selected.size > 0 ? "white" : "#999", borderRadius: "9999px",
            fontWeight: 700, fontSize: "14px", border: "none", cursor: selected.size > 0 ? "pointer" : "not-allowed",
          }}
        >
          {selected.size > 0 ? `Add ${selected.size} Card${selected.size > 1 ? "s" : ""}` : "Add Selected Cards"}
        </button>
      </div>
    </div>
  );
}
