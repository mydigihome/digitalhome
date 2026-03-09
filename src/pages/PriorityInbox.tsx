import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Search, Plus, Loader2, Inbox } from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, differenceInHours, differenceInMinutes, format } from "date-fns";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGmailConnection,
  useConnectGmail,
  useHandleGmailCallback,
  useGmailEmails,
  useTrackedThreads,
  useTrackThread,
  useUntrackThread,
  useUpdateThreadCategory,
  useDisconnectGmail,
  type GmailEmail,
  type TrackedThread,
} from "@/hooks/useGmail";

/* ─── design tokens ─── */
const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.3)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 20,
};

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-600",
  "bg-purple-100 text-purple-600",
  "bg-blue-100 text-blue-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
];

/* ─── helpers ─── */
function getInitials(name?: string | null, email?: string | null) {
  if (name?.trim()) return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
  if (email) return email.substring(0, 2).toUpperCase();
  return "?";
}

function getAvatarColor(sender: string) {
  const hash = sender.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getTimeAgo(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  if (isToday(date)) {
    const h = differenceInHours(now, date);
    if (h < 1) return `${differenceInMinutes(now, date)}m ago`;
    return `${h}h ago`;
  }
  if (isYesterday(date)) return "Yesterday";
  const days = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (days < 7) return `${days}d ago`;
  return format(date, "MMM d");
}

/* ─── component ─── */
export default function PriorityInbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Gmail hooks
  const { data: connection, isLoading: connectionLoading } = useGmailConnection();
  const { connect, connecting } = useConnectGmail();
  const { handleCallback } = useHandleGmailCallback();
  const { data: emailData, isLoading: emailsLoading } = useGmailEmails();
  const { data: trackedThreads, isLoading: trackedLoading } = useTrackedThreads();
  const trackThread = useTrackThread();
  const untrackThread = useUntrackThread();
  const updateCategory = useUpdateThreadCategory();
  const disconnectGmail = useDisconnectGmail();

  // OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleCallback(code)
        .then(() => setSearchParams({}, { replace: true }))
        .catch(() => setSearchParams({}, { replace: true }));
    }
  }, []);

  const trackedIds = useMemo(
    () => new Set(trackedThreads?.map((t) => t.thread_id) || []),
    [trackedThreads]
  );

  const isConnected = !!connection;

  // Build unified thread list from tracked + emails
  const allThreads = useMemo(() => {
    const tracked = (trackedThreads || []).map((t) => ({
      id: t.id,
      threadId: t.thread_id,
      senderName: t.sender_name,
      senderEmail: t.sender_email,
      subject: t.subject,
      snippet: t.preview,
      date: t.last_activity_at || t.tracked_at,
      priority: t.status === "Waiting for Reply" || t.status === "New Response",
      waiting: t.status === "Waiting for Reply",
      isTracked: true,
      category: t.category,
    }));

    const emails = (emailData?.emails || [])
      .filter((e) => !trackedIds.has(e.threadId))
      .map((e) => ({
        id: e.id,
        threadId: e.threadId,
        senderName: e.senderName,
        senderEmail: e.senderEmail,
        subject: e.subject,
        snippet: e.preview,
        date: e.timestamp,
        priority: false,
        waiting: false,
        isTracked: false,
        category: "General",
      }));

    return [...tracked, ...emails];
  }, [trackedThreads, emailData, trackedIds]);

  // Filter
  const filteredThreads = useMemo(() => {
    let list = allThreads;
    if (activeFilter === "important") list = list.filter((t) => t.priority || t.isTracked);
    if (activeFilter === "unread") list = list.filter((t) => !t.isTracked);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.subject?.toLowerCase().includes(q) ||
          t.senderName?.toLowerCase().includes(q) ||
          t.senderEmail?.toLowerCase().includes(q) ||
          t.snippet?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allThreads, activeFilter, search]);

  const priorityThreads = filteredThreads.filter((t) => t.priority || t.isTracked).slice(0, 5);
  const earlierThreads = filteredThreads.filter((t) => !t.priority && !t.isTracked);

  // AI summary
  const aiSummary = useMemo(() => {
    const urgent = priorityThreads.length;
    if (urgent === 0) return "You're all caught up! No urgent items at the moment.";
    const names = priorityThreads
      .slice(0, 2)
      .map((t) => t.senderName || t.senderEmail?.split("@")[0] || "Someone");
    if (urgent === 1) return `You have 1 urgent item from ${names[0]}.`;
    if (urgent === 2) return `You have 2 urgent items from ${names[0]} and ${names[1]}.`;
    return `You have ${urgent} urgent items: messages from ${names.join(", ")}, and more.`;
  }, [priorityThreads]);

  const filters = ["all", "unread", "important", "tracked"];

  return (
    <AppShell>
      <div className="min-h-screen" style={{ background: "#F8F9FC" }}>
        <div className="max-w-xl mx-auto px-4 pt-6 pb-32">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Priority Inbox
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI-curated • Important first
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 bg-white/70 backdrop-blur rounded-full flex items-center justify-center border border-white/30 text-slate-500 hover:text-slate-700 transition">
                  <Search className="w-4 h-4" />
                </button>
                {isConnected && (
                  <button
                    onClick={() => disconnectGmail.mutate()}
                    className="text-[10px] text-slate-400 hover:text-red-500 transition"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            {/* Search (toggle-able) */}
            {isConnected && (
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by sender, subject, or content..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white/70 backdrop-blur border border-white/30 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                />
              </div>
            )}
          </div>

          {/* Not connected */}
          {connectionLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-3xl" />
              ))}
            </div>
          ) : !isConnected ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div
                className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mb-4"
              >
                <Mail className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Connect Gmail
              </h2>
              <p className="text-sm text-slate-400 mb-6 max-w-sm">
                Connect your Gmail account to start tracking important email
                threads.
              </p>
              <button
                onClick={connect}
                disabled={connecting}
                className="px-6 py-3 bg-[#7C3AED] text-white rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-[#6D2ECE] shadow-lg shadow-[#7C3AED]/30 active:scale-95 transition-transform disabled:opacity-50"
              >
                {connecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Connect Gmail
              </button>
            </div>
          ) : (
            <>
              {/* AI Summary */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-[20px] mb-5"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(99,102,241,0.08))",
                  border: "1px solid rgba(124,58,237,0.15)",
                  backdropFilter: "blur(20px)",
                  borderRadius: 20,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">✨</span>
                  <span className="text-xs font-semibold text-purple-700">
                    Summary
                  </span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {aiSummary}
                </p>
              </motion.div>

              {/* Filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                      activeFilter === f
                        ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30"
                        : "bg-white/70 backdrop-blur text-slate-600 border border-white/30 hover:bg-white"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Priority Now */}
              {priorityThreads.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-6"
                >
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Priority Now
                  </h3>
                  <div className="space-y-3">
                    {priorityThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className="relative p-4 bg-white rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
                        onClick={() => {}}
                      >
                        {/* Purple accent */}
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#7C3AED] rounded-full" />

                        <div className="pl-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${getAvatarColor(
                                  thread.senderName || thread.senderEmail || ""
                                )}`}
                              >
                                {getInitials(
                                  thread.senderName,
                                  thread.senderEmail
                                )}
                              </div>
                              <span className="text-sm font-semibold text-slate-900">
                                {thread.senderName ||
                                  thread.senderEmail?.split("@")[0] ||
                                  "Unknown"}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {getTimeAgo(thread.date)}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                            {thread.subject || "(No Subject)"}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                            {thread.snippet || "No preview available..."}
                          </p>

                          {thread.waiting && (
                            <div className="flex gap-2 mt-2">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                                Waiting
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Untrack button */}
                        {thread.isTracked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              untrackThread.mutate(thread.threadId);
                            }}
                            className="absolute top-3 right-3 text-[10px] text-slate-400 hover:text-red-500 transition"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Earlier */}
              {earlierThreads.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6"
                >
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Earlier
                  </h3>
                  <div className="space-y-2">
                    {earlierThreads.slice(0, 10).map((thread) => (
                      <div
                        key={thread.id}
                        className="p-4 bg-white/50 backdrop-blur rounded-[20px] border border-slate-100/50 hover:bg-white hover:shadow-md transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${getAvatarColor(
                                thread.senderName || thread.senderEmail || ""
                              )}`}
                            >
                              {getInitials(
                                thread.senderName,
                                thread.senderEmail
                              )}
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                              {thread.senderName ||
                                thread.senderEmail?.split("@")[0] ||
                                "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">
                              {getTimeAgo(thread.date)}
                            </span>
                            {!thread.isTracked && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const email: GmailEmail = {
                                    id: thread.id,
                                    threadId: thread.threadId,
                                    senderName: thread.senderName || "",
                                    senderEmail: thread.senderEmail || "",
                                    subject: thread.subject || "",
                                    preview: thread.snippet || "",
                                    timestamp: thread.date || "",
                                    labelIds: [],
                                  };
                                  trackThread.mutate(email);
                                }}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition"
                              >
                                Track
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-slate-700 line-clamp-1">
                          {thread.subject || "(No Subject)"}
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                          {thread.snippet || "No preview available..."}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Empty */}
              {filteredThreads.length === 0 &&
                !emailsLoading &&
                !trackedLoading && (
                  <div className="flex flex-col items-center py-16 text-center">
                    <div className="w-14 h-14 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                      <Inbox className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-400">
                      {activeFilter === "all"
                        ? "Your inbox is empty! Time to relax."
                        : `No ${activeFilter} messages found.`}
                    </p>
                  </div>
                )}

              {/* Loading */}
              {(emailsLoading || trackedLoading) && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-28 rounded-[20px]" />
                  ))}
                </div>
              )}

              {/* Add another account */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 text-center"
                style={glass}
              >
                <div className="p-6">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    Add Another Account
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Connect more sources to track important threads across your
                    ecosystem.
                  </p>
                  <button
                    onClick={connect}
                    className="px-6 py-2.5 bg-[#7C3AED] text-white rounded-full text-sm font-semibold flex items-center gap-2 mx-auto hover:bg-[#6D2ECE] shadow-lg shadow-[#7C3AED]/30 active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                    Connect Gmail
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
