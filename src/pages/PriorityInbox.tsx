import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, Search, CheckCircle2, Clock, MessageCircle, ArrowUpRight, Inbox, Loader2, X, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGmailConnection, useConnectGmail, useHandleGmailCallback,
  useGmailEmails, useTrackedThreads, useTrackThread, useUntrackThread,
  useUpdateThreadCategory, useDisconnectGmail,
  type GmailEmail, type TrackedThread,
} from "@/hooks/useGmail";

const CATEGORIES = ["All", "General", "Brand Partnerships", "Collaborations", "School/Admin", "Client Work", "Personal", "Other"];

function StatusBadge({ status }: { status: string }) {
  if (status === "Waiting for Reply") {
    return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs gap-1"><Clock className="h-3 w-3" />Waiting</Badge>;
  }
  if (status === "New Response") {
    return <Badge className="bg-violet-100 text-violet-800 border-violet-200 text-xs gap-1"><MessageCircle className="h-3 w-3" />New Response</Badge>;
  }
  return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs gap-1"><CheckCircle2 className="h-3 w-3" />Up to Date</Badge>;
}

function EmailCard({ email, isTracked, onTrack, onUntrack }: {
  email: GmailEmail; isTracked: boolean;
  onTrack: (e: GmailEmail) => void; onUntrack: (threadId: string) => void;
}) {
  const timeAgo = email.timestamp ? formatDistanceToNow(new Date(email.timestamp), { addSuffix: true }) : "";

  return (
    <div className="group rounded-3xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {email.senderName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{email.senderName}</p>
              <p className="text-xs text-muted-foreground truncate">{email.senderEmail}</p>
            </div>
          </div>
          <p className="text-sm font-medium text-foreground mt-2 line-clamp-1">{email.subject}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{email.preview}</p>
          {timeAgo && <p className="text-xs text-muted-foreground/70 mt-2">{timeAgo}</p>}
        </div>
        <div className="shrink-0">
          {isTracked ? (
            <Button size="sm" variant="outline" onClick={() => onUntrack(email.threadId)}
              className="gap-1.5 text-violet-600 border-violet-200 hover:bg-violet-50">
              <Check className="h-3.5 w-3.5" /> Tracked
            </Button>
          ) : (
            <Button size="sm" onClick={() => onTrack(email)}
              className="gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white">
              <ArrowUpRight className="h-3.5 w-3.5" /> Track
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackedThreadCard({ thread, onUntrack, onCategoryChange }: {
  thread: TrackedThread;
  onUntrack: (threadId: string) => void;
  onCategoryChange: (threadId: string, category: string) => void;
}) {
  const timeAgo = thread.last_activity_at
    ? formatDistanceToNow(new Date(thread.last_activity_at), { addSuffix: true })
    : "";

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {thread.sender_name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{thread.sender_name}</p>
              <p className="text-xs text-muted-foreground truncate">{thread.sender_email}</p>
            </div>
            <StatusBadge status={thread.status} />
          </div>
          <p className="text-sm font-medium text-foreground line-clamp-1">{thread.subject}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{thread.preview}</p>
          <div className="flex items-center gap-3 mt-3">
            <Select value={thread.category} onValueChange={(v) => onCategoryChange(thread.thread_id, v)}>
              <SelectTrigger className="h-7 w-auto text-xs border-border rounded-full px-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter(c => c !== "All").map(c => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {timeAgo && <span className="text-xs text-muted-foreground">Last activity: {timeAgo}</span>}
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onUntrack(thread.thread_id)}
          className="shrink-0 text-muted-foreground hover:text-destructive">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function PriorityInbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<"inbox" | "tracked">("tracked");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

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

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      handleCallback(code).then(() => {
        setSearchParams({}, { replace: true });
      }).catch(() => {
        setSearchParams({}, { replace: true });
      });
    }
  }, []);

  const trackedIds = useMemo(() => new Set(trackedThreads?.map(t => t.thread_id) || []), [trackedThreads]);

  const filteredTracked = useMemo(() => {
    let threads = trackedThreads || [];
    if (activeCategory !== "All") threads = threads.filter(t => t.category === activeCategory);
    if (search) {
      const q = search.toLowerCase();
      threads = threads.filter(t =>
        t.subject?.toLowerCase().includes(q) ||
        t.sender_name?.toLowerCase().includes(q) ||
        t.sender_email?.toLowerCase().includes(q) ||
        t.preview?.toLowerCase().includes(q)
      );
    }
    return threads;
  }, [trackedThreads, activeCategory, search]);

  const filteredEmails = useMemo(() => {
    if (!emailData?.emails) return [];
    if (!search) return emailData.emails;
    const q = search.toLowerCase();
    return emailData.emails.filter(e =>
      e.subject?.toLowerCase().includes(q) ||
      e.senderName?.toLowerCase().includes(q) ||
      e.senderEmail?.toLowerCase().includes(q) ||
      e.preview?.toLowerCase().includes(q)
    );
  }, [emailData, search]);

  const waitingCount = trackedThreads?.filter(t => t.status === "Waiting for Reply").length || 0;

  const isConnected = !!connection;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Priority Inbox</h1>
              <p className="text-sm text-muted-foreground">Track and manage your important email threads</p>
            </div>
          </div>
        </div>

        {/* Not connected state */}
        {connectionLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
          </div>
        ) : !isConnected ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-violet-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Connect Gmail</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Connect your Gmail account to start tracking important email threads.
            </p>
            <Button onClick={connect} disabled={connecting} size="lg"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl gap-2">
              {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Connect Gmail
            </Button>
          </div>
        ) : (
          <>
            {/* Connected controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="flex gap-2">
                <Button variant={view === "tracked" ? "default" : "outline"} size="sm"
                  onClick={() => setView("tracked")}
                  className={view === "tracked" ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full" : "rounded-full"}>
                  Tracked {waitingCount > 0 && <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5">{waitingCount}</Badge>}
                </Button>
                <Button variant={view === "inbox" ? "default" : "outline"} size="sm"
                  onClick={() => setView("inbox")}
                  className={view === "inbox" ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full" : "rounded-full"}>
                  All Emails
                </Button>
              </div>
              <div className="relative flex-1 w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by sender, subject, or content..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 rounded-full border-border" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => disconnectGmail.mutate()}
                className="text-xs text-muted-foreground hover:text-destructive shrink-0">
                Disconnect
              </Button>
            </div>

            {/* Category tabs for tracked view */}
            {view === "tracked" && (
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
                <TabsList className="bg-muted/50 rounded-full p-1 h-auto flex-wrap">
                  {CATEGORIES.map(c => (
                    <TabsTrigger key={c} value={c} className="rounded-full text-xs px-3 py-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                      {c}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}

            {/* Content */}
            {view === "tracked" ? (
              trackedLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
                </div>
              ) : filteredTracked.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 rounded-3xl bg-muted flex items-center justify-center mb-4">
                    <Inbox className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    {activeCategory !== "All" || search
                      ? "No tracked emails match your filters."
                      : "No tracked emails yet. Click 'Track' on important emails to get started."}
                  </p>
                  {activeCategory === "All" && !search && (
                    <Button variant="outline" size="sm" onClick={() => setView("inbox")} className="mt-4 rounded-full">
                      Browse Emails
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTracked.map(thread => (
                    <TrackedThreadCard key={thread.id} thread={thread}
                      onUntrack={(id) => untrackThread.mutate(id)}
                      onCategoryChange={(id, cat) => updateCategory.mutate({ threadId: id, category: cat })} />
                  ))}
                </div>
              )
            ) : (
              emailsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-28 rounded-3xl" />)}
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-muted-foreground">No emails found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEmails.map(email => (
                    <EmailCard key={email.id} email={email}
                      isTracked={trackedIds.has(email.threadId)}
                      onTrack={(e) => trackThread.mutate(e)}
                      onUntrack={(id) => untrackThread.mutate(id)} />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
