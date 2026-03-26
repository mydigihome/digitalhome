import { useState } from "react";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";

export function PlaidBannerFront() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConnecting(true);
    setTimeout(() => { setConnecting(false); setConnected(true); }, 1500);
  };

  if (connected) {
    return (
      <div className="flex items-center justify-between flex-wrap gap-4" style={{ borderLeft: "4px solid #006c49", marginLeft: -32, paddingLeft: 28 }}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#006c49" }} /><span className="relative inline-flex rounded-full h-3 w-3" style={{ background: "#006c49" }} /></span>
          <div>
            <p className="font-bold text-sm" style={{ color: "#1a1c1f" }}>Connected to Chase</p>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#767586" }}>Last synced 2 minutes ago</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={(e) => e.stopPropagation()} className="rounded-full px-5 py-2 text-sm font-bold border" style={{ borderColor: "#4648d4", color: "#4648d4" }}>Sync Now</button>
          <button onClick={(e) => { e.stopPropagation(); setConnected(false); }} className="text-sm font-bold" style={{ color: "#ba1a1a" }}>Disconnect</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-2xl" style={{ color: "#4648d4" }}>account_balance</span>
        <div>
          <p className="font-bold text-sm" style={{ color: "#1a1c1f" }}>Connect your bank to unlock all financial insights</p>
          <p className="text-xs" style={{ color: "#767586" }}>Bills, transactions, and balances sync automatically</p>
        </div>
      </div>
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="rounded-full px-6 py-2.5 font-bold text-sm text-white shrink-0"
        style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
      >
        {connecting ? (
          <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting...</span>
        ) : "Connect Bank Account"}
      </button>
    </div>
  );
}

export function PlaidBannerBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [inst, setInst] = useState("Chase");
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1a1c1f" }}>Edit Connection</h3>
      <div><EditLabel>Institution Name</EditLabel><EditInput value={inst} onChange={setInst} /></div>
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
