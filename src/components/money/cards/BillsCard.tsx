import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

interface Bill {
  id: string; icon: string; name: string; amount: number; dueDays: number; source: "plaid" | "manual";
}

const initialBills: Bill[] = [
  { id: "1", icon: "H", name: "Monthly Rent", amount: 2250, dueDays: 5, source: "manual" },
  { id: "2", icon: "M", name: "Spotify Premium", amount: 16.99, dueDays: 18, source: "plaid" },
  { id: "3", icon: "T", name: "Netflix", amount: 15.49, dueDays: 18, source: "plaid" },
  { id: "4", icon: "C", name: "Credit Card Min", amount: 85, dueDays: 20, source: "manual" },
  { id: "5", icon: "S", name: "Student Loan", amount: 280, dueDays: 25, source: "manual" },
];

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today = new Date();

export function BillsFront() {
  const [bills, setBills] = useState(initialBills);
  const [editingId, setEditingId] = useState<string | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return d;
  });

  const removeBill = (id: string) => setBills((b) => b.filter((x) => x.id !== id));
  const addBill = () => {
    const id = String(Date.now());
    setBills((b) => [...b, { id, icon: "N", name: "New Bill", amount: 0, dueDays: 30, source: "manual" }]);
    setEditingId(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Upcoming Bills</h3>
        <span className="text-sm font-bold" style={{ color: "#767586" }}>Next 30 days: $1,946</span>
      </div>

      {/* Calendar strip */}
      <div className="flex gap-2 justify-between mb-3 py-1">
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[9px]" style={{ color: "#767586" }}>{days[d.getDay()]}</span>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? "text-white" : ""}`} style={isToday ? { background: "#6366f1" } : { color: "#464554" }}>
                {d.getDate()}
              </div>
              {(i === 2 || i === 5) && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#f59e0b" }} />}
            </div>
          );
        })}
      </div>

      {/* Bills list */}
      <div className="space-y-2">
        {bills.map((bill) => {
          const urgent = bill.dueDays <= 7;
          return (
            <div
              key={bill.id}
              className={`rounded-[20px] p-4 flex items-center justify-between ${urgent ? "rounded-l-none" : ""}`}
              style={{
                background: urgent ? "#FFFBEB" : "#f3f3f8",
                borderLeft: urgent ? "4px solid #F59E0B" : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{bill.icon}</span>
                <div>
                  <p className="font-bold text-sm" style={{ color: "#1a1c1f" }}>{bill.name}</p>
                  <p className="text-[10px]" style={{ color: "#767586" }}>Due in {bill.dueDays} days</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: "#1a1c1f" }}>{fmt(bill.amount)}</span>
                {bill.source === "plaid" ? (
                  <span className="text-[9px] font-bold rounded-full px-2 py-0.5" style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>Plaid</span>
                ) : (
                  <>
                    <span className="text-[9px] font-bold rounded-full px-2 py-0.5" style={{ background: "#f3f3f8", color: "#767586" }}>Manual</span>
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(bill.id); }} className="p-1 rounded-lg hover:bg-white/50"><Pencil className="w-3.5 h-3.5" style={{ color: "#767586" }} /></button>
                    <button onClick={(e) => { e.stopPropagation(); removeBill(bill.id); }} className="p-1 rounded-lg hover:bg-white/50"><Trash2 className="w-3.5 h-3.5" style={{ color: "#ba1a1a" }} /></button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={(e) => { e.stopPropagation(); addBill(); }} className="w-full mt-3 rounded-[16px] py-2.5 text-sm font-bold border-2 border-dashed" style={{ borderColor: "rgba(99,102,241,0.3)", color: "#6366f1" }}>
        + Add Bill
      </button>
    </div>
  );
}

export function BillsBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Bills</h3>
      {initialBills.filter(b => b.source === "manual").map((b) => (
        <div key={b.id} className="grid grid-cols-2 gap-2">
          <div><EditLabel>{b.icon} Name</EditLabel><EditInput value={b.name} onChange={() => {}} /></div>
          <div><EditLabel>Amount</EditLabel><EditInput value={String(b.amount)} onChange={() => {}} type="number" /></div>
        </div>
      ))}
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
