import { useState, useCallback, useEffect } from "react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import MoneyCard from "./MoneyCard";
import { PlaidBannerFront, PlaidBannerBack } from "./cards/PlaidBanner";
import { NetWorthFront, NetWorthBack } from "./cards/NetWorthCard";
import { SpendingFront, SpendingBack } from "./cards/SpendingCard";
import { DebtFront, DebtBack } from "./cards/DebtCard";
import { SavingsRateFront, SavingsRateBack } from "./cards/SavingsRateCard";
import { CreditScoreFront, CreditScoreBack } from "./cards/CreditScoreCard";
import { BillsFront, BillsBack } from "./cards/BillsCard";
import { CashflowFront, CashflowBack } from "./cards/CashflowCard";
import { EmergencyFundFront, EmergencyFundBack } from "./cards/EmergencyFundCard";
import { SalaryFront, SalaryBack } from "./cards/SalaryCard";
import { TradingViewFront, TradingViewBack } from "./cards/TradingViewCard";

const DEFAULT_ORDER = [
  "plaid", "net-worth", "spending", "debt", "savings-rate",
  "credit-score", "bills", "cashflow", "emergency", "salary", "tradingview",
];

const FULL_WIDTH = new Set(["plaid", "cashflow", "tradingview"]);

// pairs: row1=[plaid], row2=[net-worth, spending], row3=[debt, savings-rate], etc.
const GRID_PAIRS: Record<string, string | undefined> = {
  "net-worth": "spending",
  "spending": "net-worth",
  "debt": "savings-rate",
  "savings-rate": "debt",
  "credit-score": "bills",
  "bills": "credit-score",
  "emergency": "salary",
  "salary": "emergency",
};

function noop() {}

export default function MoneyTab() {
  const [order, setOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("money_tab_card_order");
      return saved ? JSON.parse(saved) : DEFAULT_ORDER;
    } catch {
      return DEFAULT_ORDER;
    }
  });

  useEffect(() => {
    localStorage.setItem("money_tab_card_order", JSON.stringify(order));
  }, [order]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setOrder((items) => {
        const oldIdx = items.indexOf(active.id as string);
        const newIdx = items.indexOf(over.id as string);
        return arrayMove(items, oldIdx, newIdx);
      });
    }
  }, []);

  const cardMap: Record<string, { front: React.ReactNode; back: React.ReactNode }> = {
    plaid: { front: <PlaidBannerFront />, back: <PlaidBannerBack onCancel={noop} onSave={noop} /> },
    "net-worth": { front: <NetWorthFront />, back: <NetWorthBack onCancel={noop} onSave={noop} /> },
    spending: { front: <SpendingFront />, back: <SpendingBack onCancel={noop} onSave={noop} /> },
    debt: { front: <DebtFront />, back: <DebtBack onCancel={noop} onSave={noop} /> },
    "savings-rate": { front: <SavingsRateFront />, back: <SavingsRateBack onCancel={noop} onSave={noop} /> },
    "credit-score": { front: <CreditScoreFront />, back: <CreditScoreBack onCancel={noop} onSave={noop} /> },
    bills: { front: <BillsFront />, back: <BillsBack onCancel={noop} onSave={noop} /> },
    cashflow: { front: <CashflowFront />, back: <CashflowBack onCancel={noop} onSave={noop} /> },
    emergency: { front: <EmergencyFundFront />, back: <EmergencyFundBack onCancel={noop} onSave={noop} /> },
    salary: { front: <SalaryFront />, back: <SalaryBack onCancel={noop} onSave={noop} /> },
    tradingview: { front: <TradingViewFront />, back: <TradingViewBack onCancel={noop} onSave={noop} /> },
  };

  // Build rows from order
  const rows: string[][] = [];
  const placed = new Set<string>();
  for (const id of order) {
    if (placed.has(id)) continue;
    if (FULL_WIDTH.has(id)) {
      rows.push([id]);
      placed.add(id);
    } else {
      // find its pair in remaining order
      const pair = GRID_PAIRS[id];
      if (pair && !placed.has(pair)) {
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
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8" style={{ background: "#f3f3f8", minHeight: "100vh" }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {rows.map((row, ri) => (
            <div key={ri} className={`grid gap-8 ${row.length === 2 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
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
                  />
                );
              })}
            </div>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
