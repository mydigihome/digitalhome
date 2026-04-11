import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Building2, RefreshCw, CheckCircle,
  Wifi, DollarSign, CreditCard,
  TrendingUp, AlertCircle,
} from "lucide-react";

interface PlaidAccount {
  checking_balance: number;
  savings_balance: number;
  credit_balance: number;
  total_balance: number;
  last_synced: string;
  institution_name?: string;
}

export default function PlaidConnect() {
  const { user } = useAuth();
  const isDark = document.documentElement.classList.contains("dark");

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [linking, setLinking] = useState(false);
  const [accounts, setAccounts] = useState<PlaidAccount | null>(null);
  const [institutionName, setInstitutionName] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  const border = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const bg = isDark ? "#1C1C1E" : "#ffffff";
  const bg2 = isDark ? "#252528" : "#F9FAFB";
  const text1 = isDark ? "#F2F2F2" : "#111827";
  const text2 = isDark ? "rgba(255,255,255,0.5)" : "#6B7280";
  const green = "#10B981";

  const fmt = (n: number) => {
    if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "K";
    return "$" + n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    if (!user) return;
    checkConnection();
    checkPlanAndUsage();
  }, [user]);

  const checkPlanAndUsage = async () => {
    if (!user) return;
    try {
      const { data: prefs } = await (supabase as any)
        .from("user_preferences")
        .select("is_subscribed, subscription_type, plan_tier")
        .eq("user_id", user.id)
        .maybeSingle();
      setIsPaid(
        !!prefs?.is_subscribed ||
        (prefs?.plan_tier != null &&
         prefs?.plan_tier !== 'free')
      );
    } catch (err) {
      console.error("Plan check error:", err);
    }
  };

  const checkConnection = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: conn } = await (supabase as any)
        .from("plaid_connections")
        .select("institution_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (conn) {
        setConnected(true);
        setInstitutionName(conn.institution_name || "My Bank");
        await loadAccounts();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const loadAccounts = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("plaid_accounts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setAccounts(data);
  };

  const handleConnect = async () => {
    if (!user) return;
    setLinking(true);
    try {
      console.log("Invoking plaid-link-token with user_id:", user?.id);
      if (!user?.id) {
        toast.error("You must be logged in to connect a bank");
        setLinking(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("plaid-link-token", {
        body: { user_id: user.id },
        headers: { "Content-Type": "application/json" },
      });

      console.log("plaid-link-token response:", data, error);

      if (error) {
        toast.error("Function error: " + error.message);
        setLinking(false);
        return;
      }

      if (data?.error) {
        toast.error("Plaid error: " + data.error + " Code: " + data.code);
        setLinking(false);
        return;
      }

      const linkToken = data.link_token;

      await new Promise<void>((resolve, reject) => {
        if ((window as any).Plaid) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Plaid"));
        document.head.appendChild(script);
      });

      const handler = (window as any).Plaid.create({
        token: linkToken,
        onSuccess: async (public_token: string, metadata: any) => {
          try {
            const institution = metadata?.institution?.name || "My Bank";
            const { data: exchData, error: exchErr } = await supabase.functions.invoke(
              "plaid-exchange-token",
              {
                body: {
                  public_token,
                  user_id: user.id,
                  institution_name: institution,
                },
                headers: { "Content-Type": "application/json" },
              }
            );

            if (exchErr || exchData?.error) {
              throw new Error(exchErr?.message || exchData?.error);
            }

            setConnected(true);
            setInstitutionName(institution);
            toast.success(institution + " connected! Syncing your data...");
            await handleSync(true);
          } catch (err: any) {
            toast.error("Connection failed: " + err.message);
          }
        },
        onExit: (err: any) => {
          if (err) console.error("Plaid exit error:", err);
          setLinking(false);
        },
        onLoad: () => {},
        onEvent: () => {},
      });

      handler.open();
    } catch (err: any) {
      console.error("Plaid connect error:", err);
      toast.error("Could not open bank connection: " + err.message);
      setLinking(false);
    }
  };

  const handleSync = async (silent = false) => {
    if (!user) return;
    setSyncing(true);
    if (!silent) toast.info("Syncing your accounts...");
    try {
      const { data, error } = await supabase.functions.invoke("plaid-sync-transactions", {
        body: { user_id: user.id },
        headers: { "Content-Type": "application/json" },
      });

      if (error || data?.error) {
        throw new Error(error?.message || data?.error);
      }

      await loadAccounts();

      if (!silent) {
        toast.success("Synced! " + (data.synced_items || 0) + " accounts updated.");
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      if (!silent) toast.error("Sync failed: " + err.message);
    }
    setSyncing(false);
    setLinking(false);
  };

  const handleDisconnect = async () => {
    if (!user) return;
    if (!window.confirm("Disconnect your bank? Your transaction history will be kept.")) return;

    await (supabase as any).from("plaid_connections").delete().eq("user_id", user.id);
    await (supabase as any).from("plaid_accounts").delete().eq("user_id", user.id);

    setConnected(false);
    setAccounts(null);
    setInstitutionName("");
    toast.success("Bank disconnected");
  };

  if (loading) {
    return (
      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 16,
        padding: 24,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <RefreshCw size={18} color={text2} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ color: text2, fontSize: 14, fontFamily: "Inter, sans-serif" }}>
          Checking bank connection...
        </span>
      </div>
    );
  }

  if (!connected) {
    return (
      <div style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 16,
        overflow: "hidden",
      }}>
        <div style={{ padding: "28px 24px 20px", textAlign: "center" as const }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Building2 size={28} color={green} />
          </div>
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: text1,
            fontFamily: "Inter, sans-serif",
            marginBottom: 8,
          }}>
            Connect Your Bank
          </div>
          <div style={{
            fontSize: 14,
            color: text2,
            fontFamily: "Inter, sans-serif",
            lineHeight: 1.5,
            maxWidth: 340,
            margin: "0 auto",
          }}>
            Securely link your bank account to automatically track balances, transactions, and bills in real time.
          </div>
        </div>

        <div style={{ padding: "0 24px 24px" }}>
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
            marginBottom: 20,
          }}>
            {[
              { icon: "🏦", label: "Real balances" },
              { icon: "📊", label: "Auto transactions" },
              { icon: "🔔", label: "Bill tracking" },
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                background: bg2,
                borderRadius: 8,
                fontSize: 13,
                color: text1,
                fontFamily: "Inter, sans-serif",
              }}>
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleConnect}
            disabled={linking}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: "linear-gradient(135deg, #10B981, #059669)",
              border: "none",
              borderRadius: 12,
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "Inter, sans-serif",
              cursor: linking ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: linking ? 0.7 : 1,
            }}
          >
            {linking ? (
              <>
                <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                Connecting...
              </>
            ) : (
              <>
                <Wifi size={16} />
                Connect Bank Account
              </>
            )}
          </button>

          <div style={{
            textAlign: "center" as const,
            marginTop: 12,
            fontSize: 12,
            color: text2,
            fontFamily: "Inter, sans-serif",
          }}>
            🔒 Secured by Plaid · Your credentials are never stored
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 16,
      overflow: "hidden",
    }}>
      {/* Connected header */}
      <div style={{
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <CheckCircle size={20} color={green} />
          </div>
          <div>
            <div style={{
              fontSize: 15,
              fontWeight: 700,
              color: text1,
              fontFamily: "Inter, sans-serif",
            }}>
              {institutionName}
            </div>
            <div style={{
              fontSize: 12,
              color: text2,
              fontFamily: "Inter, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <span style={{ color: green }}>●</span> Connected
              {accounts?.last_synced && (
                <span>
                  · Last sync{" "}
                  {new Date(accounts.last_synced).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => handleSync()}
            disabled={syncing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4",
              border: `1px solid ${isDark ? "rgba(16,185,129,0.2)" : "#BBF7D0"}`,
              borderRadius: 8,
              color: green,
              fontSize: 13,
              fontWeight: 600,
              cursor: syncing ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
              minHeight: 36,
            }}
          >
            <RefreshCw size={14} style={syncing ? { animation: "spin 1s linear infinite" } : {}} />
            {syncing ? "Syncing..." : "Sync"}
          </button>
          <button
            onClick={handleDisconnect}
            style={{
              padding: "8px 14px",
              background: "transparent",
              border: `1px solid ${border}`,
              borderRadius: 8,
              color: text2,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              minHeight: 36,
            }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Balance cards */}
      {accounts && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          padding: 20,
        }}>
          {[
            {
              label: "Checking",
              value: accounts.checking_balance,
              icon: DollarSign,
              color: green,
              bgColor: isDark ? "rgba(16,185,129,0.08)" : "#F0FDF4",
            },
            {
              label: "Savings",
              value: accounts.savings_balance,
              icon: TrendingUp,
              color: "#3B82F6",
              bgColor: isDark ? "rgba(59,130,246,0.08)" : "#EFF6FF",
            },
            {
              label: "Credit Used",
              value: accounts.credit_balance,
              icon: CreditCard,
              color: "#F59E0B",
              bgColor: isDark ? "rgba(245,158,11,0.08)" : "#FFFBEB",
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: bg2,
              border: `1px solid ${border}`,
              borderRadius: 12,
              padding: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <item.icon size={16} color={item.color} />
                <span style={{ fontSize: 13, color: text2, fontFamily: "Inter, sans-serif" }}>
                  {item.label}
                </span>
              </div>
              <div style={{
                fontSize: 20,
                fontWeight: 700,
                color: text1,
                fontFamily: "Inter, sans-serif",
              }}>
                {fmt(item.value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {!accounts && (
        <div style={{
          padding: 24,
          textAlign: "center" as const,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}>
          <AlertCircle size={16} color={text2} />
          <span style={{ fontSize: 14, color: text2, fontFamily: "Inter, sans-serif" }}>
            Click Sync to load your account balances
          </span>
        </div>
      )}
    </div>
  );
}
