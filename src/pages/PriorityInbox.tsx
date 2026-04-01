import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Search, Plus, Loader2, Inbox, Home, FolderOpen, Calendar } from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, differenceInHours, differenceInMinutes, format } from "date-fns";
import AppShell from "@/components/AppShell";
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
} from "@/hooks/useGmail";

/* ─── design tokens ─── */
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

function formatTime(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 7) return `${days}d ago`;
  return format(date, "MMM d");
}

/* ─── component ─── */
export default function PriorityInbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Gmail hooks
  const { data: connection, isLoading: connectionLoading } = useGmailConnection();
  const { connect, connecting } = useConnectGmail();
  const { handleCallback } = useHandleGmailCallback();
  const { data: emailData, isLoading: emailsLoading } = useGmailEmails();
  const { data: trackedThreads, isLoading: trackedLoading } = useTrackedThreads();
  const trackThread = useTrackThread();
  const untrackThread = useUntrackThread();
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

  // Build unified thread list
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
      hasAttachment: false,
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
        hasAttachment: e.labelIds?.includes("ATTACHMENT") || false,
      }));

    return [...tracked, ...emails];
  }, [trackedThreads, emailData, trackedIds]);

  // Filter
  const filteredThreads = useMemo(() => {
    let list = allThreads;
    if (activeFilter === "unread") list = list.filter((t) => !t.isTracked);
    if (activeFilter === "important") list = list.filter((t) => t.priority || t.isTracked);
    if (activeFilter === "attachments") list = list.filter((t) => t.hasAttachment);
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
    if (urgent === 0) return "You're all caught up. No urgent items at the moment.";
    const names = priorityThreads
      .slice(0, 3)
      .map((t) => t.senderName || t.senderEmail?.split("@")[0] || "Someone");
    if (urgent === 1) return `You have **1 urgent item**: a message from **${names[0]}**.`;
    if (urgent === 2) return `You have **${urgent} urgent items**: messages from **${names[0]}** and **${names[1]}**.`;
    return `You have **${urgent} urgent items**: messages from **${names[0]}**, **${names[1]}**, and more.`;
  }, [priorityThreads]);

  const filters = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "important", label: "Important" },
    { key: "attachments", label: "Attachments" },
  ];

  return (
    <AppShell>
      <div className="min-h-screen bg-[#F8F9FC] dark:bg-background">
        <div className="max-w-xl mx-auto px-5 pt-8 pb-32">

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[28px] font-bold text-foreground tracking-tight">
                  Priority Inbox
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Apple Intelligence curated
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="w-9 h-9 rounded-full bg-white dark:bg-card border border-slate-100 dark:border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                >
                  <Search className="w-4 h-4" />
                </button>
                {isConnected && (
                  <button
                    onClick={() => disconnectGmail.mutate()}
                    className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 flex items-center justify-center text-amber-600 hover:bg-amber-100 transition text-xs font-bold"
                    title="Disconnect Gmail"
                  >
                    G
                  </button>
                )}
              </div>
            </div>

            {/* Search */}
            {showSearch && isConnected && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by sender, subject, or content..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-card border border-slate-100 dark:border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Loading state */}
          {connectionLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-3xl" />
              ))}
            </div>
          ) : !isConnected ? (
            /* Not connected - show connect prompt only */
            <div className="mt-4">
              <div className="rounded-[28px] border-2 border-dashed border-primary/20 p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground mb-1">
                  Add Another Account
                </h2>
                <p className="text-sm text-muted-foreground mb-5 max-w-[260px] mx-auto">
                  Connect more sources to start tracking important threads across your ecosystem.
                </p>
                <button
                  onClick={connect}
                  disabled={connecting}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold text-sm flex items-center gap-2 mx-auto hover:bg-primary/90 shadow-lg shadow-primary/30 active:scale-95 transition-transform disabled:opacity-50"
                >
                  {connecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Connect Gmail
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* AI Summary Card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 rounded-[20px] p-[1.5px]"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #6366F1, #7C3AED)",
                }}
              >
                <div className="rounded-[19px] bg-white dark:bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm"></span>
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Summary
                    </span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: aiSummary
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>')
                    }}
                  />
                </div>
              </motion.div>

              {/* Filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-5 no-scrollbar">
                {filters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                      activeFilter === f.key
                        ? "bg-foreground text-background"
                        : "bg-white dark:bg-card text-muted-foreground border border-slate-100 dark:border-border hover:bg-slate-50 dark:hover:bg-secondary"
                    }`}
                  >
                    {f.label}
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
                  <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3">
                    Priority Now
                  </h3>
                  <div className="space-y-3">
                    {priorityThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className="relative p-4 bg-white dark:bg-card rounded-[20px] border border-slate-100 dark:border-border shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
                      >
                        {/* Purple left accent */}
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-full" />

                        <div className="pl-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${getAvatarColor(
                                  thread.senderName || thread.senderEmail || ""
                                )}`}
                              >
                                {getInitials(thread.senderName, thread.senderEmail)}
                              </div>
                              <span className="text-sm font-semibold text-foreground">
                                {thread.senderName || thread.senderEmail?.split("@")[0] || "Unknown"}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(thread.date)}
                            </span>
                          </div>

                          <p className="text-sm font-bold text-foreground line-clamp-1 mb-0.5">
                            {thread.subject || "(No Subject)"}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {thread.snippet || "No preview available..."}
                          </p>

                          {thread.waiting && (
                            <div className="mt-2">
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold uppercase tracking-wide">
                                Due Soon
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
                            className="absolute top-3 right-3 text-[10px] text-muted-foreground hover:text-destructive transition"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Earlier Today */}
              {earlierThreads.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-6"
                >
                  <h3 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3">
                    Earlier Today
                  </h3>
                  <div className="space-y-2">
                    {earlierThreads.slice(0, 10).map((thread) => (
                      <div
                        key={thread.id}
                        className="p-4 bg-white dark:bg-card rounded-[20px] border border-slate-100 dark:border-border hover:shadow-md transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${getAvatarColor(
                                thread.senderName || thread.senderEmail || ""
                              )}`}
                            >
                              {getInitials(thread.senderName, thread.senderEmail)}
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {thread.senderName || thread.senderEmail?.split("@")[0] || "Unknown"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(thread.date)}
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
                                className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition"
                              >
                                Track
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-foreground line-clamp-1">
                          {thread.subject || "(No Subject)"}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {thread.snippet || "No preview available..."}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Empty */}
              {filteredThreads.length === 0 && !emailsLoading && !trackedLoading && (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="w-14 h-14 rounded-3xl bg-secondary flex items-center justify-center mb-4">
                    <Inbox className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activeFilter === "all"
                      ? "Your inbox is empty. Time to relax."
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

              {/* Add Another Account */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 rounded-[28px] border-2 border-dashed border-slate-200 dark:border-border p-8 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <p className="text-base font-bold text-foreground mb-1">
                  Add Another Account
                </p>
                <p className="text-sm text-muted-foreground mb-5 max-w-[260px] mx-auto">
                  Connect more sources to start tracking important threads across your ecosystem.
                </p>
                <button
                  onClick={connect}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold flex items-center gap-2 mx-auto hover:bg-primary/90 shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                  Connect Gmail
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
