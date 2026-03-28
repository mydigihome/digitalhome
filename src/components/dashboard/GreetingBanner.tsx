import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Flag, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences, useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useProjects } from "@/hooks/useProjects";
import { useAllTasks } from "@/hooks/useTasks";
import { useContacts } from "@/hooks/useContacts";
import { useUserFinances } from "@/hooks/useUserFinances";
import { format } from "date-fns";

function getGreetingPrefix() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Hey";
}

export default function GreetingBanner() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { data: prefs } = useUserPreferences();
  const upsertPrefs = useUpsertPreferences();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useAllTasks();
  const { data: contacts = [] } = useContacts();
  const { data: finances } = useUserFinances();
  const [visible, setVisible] = useState(true);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Check if already dismissed today
  const alreadyDismissed = (prefs as any)?.greeting_dismissed_date === todayStr;

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const monthName = format(new Date(), "MMMM");

  const activeGoals = projects.filter(p => !p.archived && p.type === "goal").length;

  const overdueContacts = useMemo(() => {
    const now = Date.now();
    return contacts.filter(c => {
      if (!c.last_contacted_date) return true;
      const daysSince = Math.floor((now - new Date(c.last_contacted_date).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince > (c.contact_frequency_days || 30);
    }).length;
  }, [contacts]);

  const netWorth = Number(finances?.current_savings || 0);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
    upsertPrefs.mutate({ greeting_dismissed_date: todayStr } as any);
  };

  if (alreadyDismissed || !visible) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          onClick={() => navigate("/monthly-review")}
          className="w-full rounded-[20px] px-6 py-4 mb-4 cursor-pointer relative"
          style={{
            background: "linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #fff0f9 100%)",
            border: "1px solid rgba(99,102,241,0.12)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.08)",
          }}
        >
          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-white transition"
            style={{ background: "rgba(255,255,255,0.6)" }}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-xl" style={{ color: "#111827", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {getGreetingPrefix()}, {firstName} 👋
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "#6b7280" }}>
                Here's your {monthName} snapshot.
              </p>

              <div className="flex gap-2 mt-3 flex-wrap">
                <span
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold shadow-sm"
                  style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.5)", color: "#111827" }}
                >
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />
                  ${netWorth.toLocaleString()}
                </span>
                <span
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold shadow-sm"
                  style={{ background: "rgba(255,255,255,0.7)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.5)", color: "#111827" }}
                >
                  <Flag className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />
                  {activeGoals} active goal{activeGoals !== 1 ? "s" : ""}
                </span>
                <span
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold shadow-sm"
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    color: overdueContacts > 0 ? "#be123c" : "#111827",
                  }}
                >
                  <Users className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />
                  {overdueContacts} overdue
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
