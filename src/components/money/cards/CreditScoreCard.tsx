import { useState } from "react";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";
import { X, Info } from "lucide-react";

interface CreditConnection {
  score: number;
  date: string;
  source: "manual" | "experian" | "creditkarma";
  connected: boolean;
}

export function CreditScoreFront() {
  const [connection, setConnection] = useState<CreditConnection | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalService, setModalService] = useState<"Experian" | "Credit Karma">("Experian");
  const [manualScore, setManualScore] = useState("785");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);

  const score = connection?.score ?? 785;
  const pct = score / 850;
  const r = 80;
  const circ = Math.PI * r;
  const dash = circ * pct;

  const getRating = (s: number) => {
    if (s >= 750) return { label: "EXCELLENT", bg: "rgba(108,248,187,0.4)", color: "#006c49" };
    if (s >= 700) return { label: "GOOD", bg: "rgba(108,248,187,0.25)", color: "#006c49" };
    if (s >= 650) return { label: "FAIR", bg: "rgba(245,158,11,0.2)", color: "#92400E" };
    return { label: "POOR", bg: "rgba(186,26,26,0.1)", color: "#ba1a1a" };
  };
  const rating = getRating(score);

  const openModal = (service: "Experian" | "Credit Karma") => {
    setModalService(service);
    setModalOpen(true);
  };

  const saveManual = () => {
    const s = parseInt(manualScore);
    if (s >= 300 && s <= 850) {
      setConnection({ score: s, date: manualDate, source: "manual", connected: true });
      setModalOpen(false);
    }
  };

  return (
    <div>
      {/* Connection banner */}
      {!connection?.connected ? (
        <div className="rounded-[14px] px-3 py-2.5 mb-3 flex items-center justify-between flex-wrap gap-2" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" style={{ color: "#F59E0B" }} />
            <span className="text-xs font-bold" style={{ color: "#92400E" }}>Estimated — connect for real-time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={e => { e.stopPropagation(); openModal("Experian"); }} className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-white" style={{ border: "1px solid #FDE68A", color: "#92400E" }}>Experian</button>
            <button onClick={e => { e.stopPropagation(); openModal("Credit Karma"); }} className="rounded-full px-2.5 py-1 text-[10px] font-bold bg-white" style={{ border: "1px solid #FDE68A", color: "#92400E" }}>Credit Karma</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold" style={{ color: "#006c49" }}>Score entered manually</span>
          <button onClick={e => { e.stopPropagation(); setConnection(null); }} className="text-[10px] font-bold" style={{ color: "#ba1a1a" }}>Reset</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Credit Matrix</h3>
        <span className="text-[10px] font-black uppercase tracking-widest rounded px-2 py-0.5" style={{ background: rating.bg, color: rating.color }}>{rating.label}</span>
      </div>

      <div className="flex justify-center" style={{ maxHeight: 110 }}>
        <svg width="180" height="110" viewBox="0 0 200 120">
          <defs>
            <linearGradient id="creditGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#6cf8bb" />
            </linearGradient>
          </defs>
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f3f3f8" strokeWidth="12" strokeLinecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#creditGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`} />
          <text x="100" y="90" textAnchor="middle" className="text-5xl font-extrabold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fill: "#1a1c1f", fontSize: 40 }}>{score}</text>
          <text x="100" y="110" textAnchor="middle" className="text-[10px] uppercase tracking-widest" style={{ fill: "#767586", fontSize: 8 }}>+12 pts this month</text>
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="rounded-xl p-3" style={{ background: "#f3f3f8" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>Utilization</p>
          <p className="font-bold" style={{ color: "#006c49" }}>2.4%</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: "#f3f3f8" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>On-time Pay</p>
          <p className="font-bold" style={{ color: "#1a1c1f" }}>100%</p>
        </div>
      </div>

      <div className="mt-2">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#767586" }}>FACTORS HELPING</p>
        <p className="text-xs" style={{ color: "#006c49" }}>Payment history: 100% on-time payments</p>
        <p className="text-xs" style={{ color: "#006c49" }}>Credit age: 5 year average</p>
      </div>

      <div className="mt-2">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>QUICK WIN</p>
        <p className="text-xs font-bold" style={{ color: "#6366f1" }}>Pay $1,500 on Sapphire Reserve → Est. +20 points</p>
      </div>

      <div className="rounded-xl p-3 mt-2" style={{ background: "#f3f3f8" }}>
        <p className="text-xs" style={{ color: "#ba1a1a" }}>Recent Hard Inquiry — Car Loan · Feb 2024</p>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          onClick={e => { e.stopPropagation(); setModalOpen(false); }}
        >
          <div
            className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#f3f3f8" }}>
                  <span className="material-symbols-outlined" style={{ color: "#6366f1" }}>credit_score</span>
                </div>
                <h3 className="font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>{modalService} Connection</h3>
              </div>
              <button onClick={e => { e.stopPropagation(); setModalOpen(false); }} className="rounded-full p-1.5" style={{ background: "#f3f3f8" }}>
                <X className="w-4 h-4" style={{ color: "#767586" }} />
              </button>
            </div>

            <p className="text-xs leading-relaxed mb-3" style={{ color: "#767586" }}>
              We use read-only access to retrieve your credit score and key factors. We never store your login credentials.
            </p>

            <div className="rounded-[14px] p-3 mb-4" style={{ background: "#f3f3f8" }}>
              <p className="text-xs font-bold" style={{ color: "#464554" }}>🔗 Direct integration coming soon.</p>
              <p className="text-xs mt-1" style={{ color: "#767586" }}>For now, enter your score manually and we'll track changes over time.</p>
            </div>

            <div className="space-y-3">
              <div>
                <EditLabel>Current Score (300-850)</EditLabel>
                <input
                  type="number"
                  min="300"
                  max="850"
                  value={manualScore}
                  onChange={e => setManualScore(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm font-medium border-none focus:ring-2 focus:outline-none"
                  style={{ background: "#f3f3f8", color: "#1a1c1f" }}
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <div>
                <EditLabel>Score Date</EditLabel>
                <input
                  type="date"
                  value={manualDate}
                  onChange={e => setManualDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm font-medium border-none focus:ring-2 focus:outline-none"
                  style={{ background: "#f3f3f8", color: "#1a1c1f" }}
                  onClick={e => e.stopPropagation()}
                />
              </div>
              <button
                onClick={e => { e.stopPropagation(); saveManual(); }}
                className="w-full rounded-full py-2.5 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)" }}
              >
                Save Score
              </button>
              <button
                onClick={e => { e.stopPropagation(); setModalOpen(false); }}
                className="w-full text-center text-sm font-bold py-1"
                style={{ color: "#767586" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CreditScoreBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Credit Score</h3>
      <div><EditLabel>Credit Score</EditLabel><EditInput value="785" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Monthly Change (pts)</EditLabel><EditInput value="12" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Utilization %</EditLabel><EditInput value="2.4" onChange={() => {}} type="number" /></div>
      <div><EditLabel>On-time %</EditLabel><EditInput value="100" onChange={() => {}} type="number" /></div>
      <div><EditLabel>Credit Age (years)</EditLabel><EditInput value="5" onChange={() => {}} type="number" /></div>
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
