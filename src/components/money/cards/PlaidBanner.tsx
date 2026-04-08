import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { EditLabel, EditInput, EditActions } from "../MoneyCard";

export function PlaidBannerFront() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [institutionName, setInstitutionName] = useState("");
  const [error, setError] = useState("");

  const handleConnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setConnecting(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("plaid-link-token", {
        body: { user_id: user.id },
      });

      if (fnError || data?.error) {
        // Plaid not configured yet — use demo mode
        if (data?.error === "Plaid credentials not configured") {
          setTimeout(() => {
            setConnecting(false);
            setConnected(true);
            setInstitutionName("Demo Bank");
            toast.success("Bank connected (demo mode)");
          }, 1500);
          return;
        }
        throw new Error(data?.error || "Failed to initialize");
      }

      // In production this would open Plaid Link with data.link_token
      // For now simulate success
      setTimeout(() => {
        setConnecting(false);
        setConnected(true);
        setInstitutionName("Chase");
        toast.success("Bank connected");
      }, 1500);
    } catch (err: any) {
      setConnecting(false);
      setError("Connection failed. Try again.");
      toast.error("Connection failed. Try again.");
    }
  };

  if (connected) {
    return (
      <div className="flex items-center justify-between flex-wrap gap-4" style={{ borderLeft: "4px solid hsl(var(--primary))", marginLeft: -32, paddingLeft: 28 }}>
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-primary" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </span>
          <div>
            <p className="font-bold text-sm text-foreground">Connected to {institutionName}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Last synced 2 minutes ago</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={(e) => e.stopPropagation()} className="rounded-full px-5 py-2 text-sm font-bold border border-primary text-primary">Sync Now</button>
          <button onClick={(e) => { e.stopPropagation(); setConnected(false); }} className="text-sm font-bold text-destructive">Disconnect</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-2xl text-primary">account_balance</span>
        <div>
          <p className="font-bold text-sm text-foreground">Connect your bank to unlock all financial insights</p>
          <p className="text-xs text-muted-foreground">Bills, transactions, and balances sync automatically</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {error && <span className="text-xs text-destructive font-medium">{error}</span>}
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="rounded-full px-6 py-2.5 font-bold text-sm text-primary-foreground shrink-0 bg-primary hover:bg-primary/90 transition-colors border-none cursor-pointer"
        >
          {connecting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Connecting...
            </span>
          ) : "Connect Bank Account"}
        </button>
      </div>
    </div>
  );
}

export function PlaidBannerBack({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const [inst, setInst] = useState("Chase");
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Edit Connection</h3>
      <div><EditLabel>Institution Name</EditLabel><EditInput value={inst} onChange={setInst} /></div>
      <EditActions onCancel={onCancel} onSave={onSave} />
    </div>
  );
}
