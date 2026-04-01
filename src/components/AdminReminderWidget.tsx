import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";

const ADMIN_EMAIL = "myslimher@gmail.com";

interface Reminder {
  id: string;
  message: string;
  reminder_type: string;
  remind_at: string;
}

export default function AdminReminderWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [foundingCount, setFoundingCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) return;

    const fetchData = async () => {
      const now = new Date().toISOString();
      const { data } = await (supabase as any)
        .from("admin_reminders")
        .select("id, message, reminder_type, remind_at")
        .eq("user_id", user.id)
        .eq("dismissed", false)
        .lte("remind_at", now);

      if (data?.length) setReminders(data);

      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("founding_member", true);
      setFoundingCount(count || 0);
    };
    fetchData();
  }, [user]);

  if (!user || user.email !== ADMIN_EMAIL || reminders.length === 0 || dismissed) return null;

  const handleDismiss = async (id: string) => {
    await (supabase as any)
      .from("admin_reminders")
      .update({ dismissed: true })
      .eq("id", id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRemindLater = async (id: string) => {
    const later = new Date();
    later.setDate(later.getDate() + 30);
    await (supabase as any)
      .from("admin_reminders")
      .update({ remind_at: later.toISOString() })
      .eq("id", id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        right: 24,
        zIndex: 9998,
        maxWidth: 320,
        background: "#111827",
        color: "#fff",
        borderRadius: 24,
        padding: 20,
        boxShadow: "0 8px 40px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.1)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>
           Admin Only
        </span>
        <button onClick={() => setDismissed(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
          <X size={14} />
        </button>
      </div>

      {reminders.map((r, i) => (
        <div key={r.id}>
          {i > 0 && <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "12px 0" }} />}
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
            {r.message.replace("{N}", String(foundingCount))}
          </p>
          <p style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginTop: 8 }}>
            Current founding members: {foundingCount}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              onClick={() => {
                toast("Lifetime offer feature coming soon");
              }}
              style={{
                background: "#f59e0b",
                color: "#111827",
                borderRadius: 9999,
                padding: "8px 16px",
                fontSize: 11,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Send Lifetime Offer
            </button>
            <button
              onClick={() => handleRemindLater(r.id)}
              style={{
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                borderRadius: 9999,
                padding: "8px 16px",
                fontSize: 11,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Remind Me Later
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
