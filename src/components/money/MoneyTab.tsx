import { useState, useCallback } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import MoneyCard from "./MoneyCard";
import { PlaidBannerFront, PlaidBannerBack } from "./cards/PlaidBanner";
import { NetWorthFront, NetWorthBack } from "./cards/NetWorthCard";
import { SpendingFront, SpendingBack } from "./cards/SpendingCard";
import { DebtFront, DebtBack } from "./cards/DebtCard";
import { CreditScoreFront, CreditScoreBack } from "./cards/CreditScoreCard";
import { BillsFront, BillsBack } from "./cards/BillsCard";
import { MoneyFlowFront, MoneyFlowBack } from "./cards/MoneyFlowCard";
import { EmergencyFundFront, EmergencyFundBack } from "./cards/EmergencyFundCard";
import { SalaryFront, SalaryBack } from "./cards/SalaryCard";
import { TradingViewFront, TradingViewBack } from "./cards/TradingViewCard";
import { useMoneyPreferences } from "@/hooks/useMoneyPreferences";
import { Eye, EyeOff, ChevronDown } from "lucide-react";

const FULL_WIDTH = new Set(["plaid", "moneyflow", "tradingview"]);

const GRID_PAIRS: Record<string, string | undefined> = {
  "net-worth": "spending",
  "spending": "net-worth",
  "debt": "credit-score",
  "credit-score": "debt",
  "bills": "emergency",
  "emergency": "bills",
  "salary": "salary",
};

const CARD_LABELS: Record<string, string> = {
  plaid: "Plaid Banner",
  "net-worth": "Net Worth",
  spending: "Spending",
  debt: "Debt Tracker",
  "credit-score": "Credit Score",
  bills: "Bills Calendar",
  moneyflow: "Money Flow",
  emergency: "Emergency Fund",
  salary: "Salary",
  tradingview: "Market Terminal",
};

function noop() {}

export default function MoneyTab() {
  const {
    cardOrder,
    hiddenCards,
    updateCardOrder,
    hideCard,
    restoreCard,
    restoreAll,
  } = useMoneyPreferences();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const oldIdx = cardOrder.indexOf(active.id as string);
      const newIdx = cardOrder.indexOf(over.id as string);
      updateCardOrder(arrayMove(cardOrder, oldIdx, newIdx));
    }
  }, [cardOrder, updateCardOrder]);

  const cardMap: Record<string, { front: React.ReactNode; back: React.ReactNode }> = {
    plaid: { front: <PlaidBannerFront />, back: <PlaidBannerBack onCancel={noop} onSave={noop} /> },
    "net-worth": { front: <NetWorthFront />, back: <NetWorthBack onCancel={noop} onSave={noop} /> },
    spending: { front: <SpendingFront />, back: <SpendingBack onCancel={noop} onSave={noop} /> },
    debt: { front: <DebtFront />, back: <DebtBack onCancel={noop} onSave={noop} /> },
    "credit-score": { front: <CreditScoreFront />, back: <CreditScoreBack onCancel={noop} onSave={noop} /> },
    bills: { front: <BillsFront />, back: <BillsBack onCancel={noop} onSave={noop} /> },
    moneyflow: { front: <MoneyFlowFront />, back: <MoneyFlowBack onCancel={noop} onSave={noop} /> },
    emergency: { front: <EmergencyFundFront />, back: <EmergencyFundBack onCancel={noop} onSave={noop} /> },
    salary: { front: <SalaryFront />, back: <SalaryBack onCancel={noop} onSave={noop} /> },
    tradingview: { front: <TradingViewFront />, back: <TradingViewBack onCancel={noop} onSave={noop} /> },
  };

  const visibleOrder = cardOrder.filter(id => !hiddenCards.includes(id));

  const rows: string[][] = [];
  const placed = new Set<string>();
  for (const id of visibleOrder) {
    if (placed.has(id)) continue;
    if (FULL_WIDTH.has(id)) {
      rows.push([id]);
      placed.add(id);
    } else {
      const pair = GRID_PAIRS[id];
      if (pair && pair !== id && !placed.has(pair) && visibleOrder.includes(pair)) {
        rows.push([id, pair]);
        placed.add(id);
        placed.add(pair);
      } else {
        rows.push([id]);
        placed.add(id);
      }
    }
  }

  return (
    <div className="min-h-screen px-4 md:px-6 py-4" style={{ background: "#f3f3f8" }}>
      <div className="max-w-[1400px] mx-auto space-y-3">
      {/* Hidden cards restore drawer */}
      {hiddenCards.length > 0 && (
        <div className="rounded-[20px] overflow-hidden" style={{ background: "#ffffff", boxShadow: "0 4px 16px rgba(70,69,84,0.05)" }}>
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="w-full flex items-center justify-between px-5 py-2.5"
          >
            <div className="flex items-center gap-2">
              <EyeOff className="w-4 h-4" style={{ color: "#767586" }} />
              <span className="text-sm font-bold" style={{ color: "#1a1c1f" }}>{hiddenCards.length} hidden card{hiddenCards.length > 1 ? "s" : ""}</span>
            </div>
            <span className="text-sm font-bold flex items-center gap-1" style={{ color: "#4648d4" }}>
              Manage <ChevronDown className={`w-3.5 h-3.5 transition-transform ${drawerOpen ? "rotate-180" : ""}`} />
            </span>
          </button>
          <div
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{ maxHeight: drawerOpen ? 200 : 0 }}
          >
            <div className="flex flex-wrap gap-2 px-5 pb-3">
              {hiddenCards.map(id => (
                <button
                  key={id}
                  onClick={() => restoreCard(id)}
                  className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
                  style={{ background: "#f3f3f8", color: "#1a1c1f" }}
                >
                  {CARD_LABELS[id] || id}
                  <Eye className="w-3.5 h-3.5" style={{ color: "#4648d4" }} />
                </button>
              ))}
              <button onClick={restoreAll} className="text-sm font-bold underline" style={{ color: "#4648d4" }}>
                Restore All
              </button>
            </div>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleOrder} strategy={verticalListSortingStrategy}>
          {rows.map((row, ri) => (
            <div key={ri} className={`grid gap-3 ${row.length === 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              {row.map((id) => {
                const c = cardMap[id];
                if (!c) return null;
                return (
                  <MoneyCard
                    key={id}
                    id={id}
                    front={c.front}
                    back={c.back}
                    fullWidth={FULL_WIDTH.has(id)}
                    onHide={() => hideCard(id)}
                    cardLabel={CARD_LABELS[id] || id}
                  />
                );
              })}
            </div>
          ))}
        </SortableContext>
      </DndContext>
      </div>
    </div>
  );
}
