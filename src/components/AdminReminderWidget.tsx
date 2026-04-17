import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Bell, X } from "lucide-react";

export default function AdminReminderWidget() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setNotifications(data);
          setVisible(true);
        }
      });
  }, [user?.id]);

  const dismiss = async (id: string) => {
    await supabase.from("notifications").update({ read: true } as any).eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notifications.length <= 1) setVisible(false);
  };

  if (!visible || notifications.length === 0) return null;

  return (
    <div style={{ position: "fixed", bottom: 80, left: 16, zIndex: 9000, maxWidth: 320, width: "100%" }}>
      {notifications.slice(0, 3).map(n => (
        <div key={n.id} style={{ background: "white", border: "1px solid #F3F4F6", borderRadius: 12, padding: "12px 16px", marginBottom: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", display: "flex", alignItems: "flex-start", gap: 10, fontFamily: "Inter, sans-serif" }}>
          <Bell size={14} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>{n.title}</p>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "2px 0 0" }}>{n.message}</p>
          </div>
          <button onClick={() => dismiss(n.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <X size={12} color="#9CA3AF" />
          </button>
        </div>
      ))}
    </div>
  );
}
