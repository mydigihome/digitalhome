import { useState, useEffect, useCallback, useRef } from "react";
import { useJournalEntries, useDeleteJournalEntry, JournalEntry } from "@/hooks/useJournal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Lock, Plus, Trash2, Calendar, Shield } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import JournalEntryModal from "./JournalEntryModal";
import PinModal from "./PinModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FILTERS = [
  { id: "all", label: "All Entries" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "locked", label: "Locked Only" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "mood", label: "By Mood" },
];

const ENTRIES_PER_PAGE = 10;

function EntrySkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
          <div className="h-3 w-20 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted mt-2" />
          <div className="h-3 w-3/4 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function JournalEntriesList() {
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pinVerifyEntry, setPinVerifyEntry] = useState<JournalEntry | null>(null);
  const [visibleCount, setVisibleCount] = useState(ENTRIES_PER_PAGE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const { data: entries, isLoading } = useJournalEntries({
    period: filter === "week" ? "week" : filter === "month" ? "month" : undefined,
    locked: filter === "locked" ? true : undefined,
    search: search || undefined,
    sort,
  });
  const deleteEntry = useDeleteJournalEntry();

  // Reset visible count when filter/sort/search changes
  useEffect(() => {
    setVisibleCount(ENTRIES_PER_PAGE);
  }, [filter, sort, search]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current || !entries) return;
    const observer = new IntersectionObserver(
      (observerEntries) => {
        if (observerEntries[0].isIntersecting && entries.length > visibleCount) {
          setVisibleCount((prev) => Math.min(prev + ENTRIES_PER_PAGE, entries.length));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [entries, visibleCount]);

  const visibleEntries = entries?.slice(0, visibleCount) || [];
  const hasMore = entries ? visibleCount < entries.length : false;

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEntry.mutateAsync(deleteId);
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteId(null);
  };

  const handleEntryClick = (entry: JournalEntry) => {
    if (entry.is_locked && entry.pin_hash) {
      setPinVerifyEntry(entry);
    } else {
      setEditEntry(entry);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Journal Entries</h2>
        <Button size="sm" onClick={() => setNewOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSort(s.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                sort === s.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entries list */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <EntrySkeleton key={i} />
          ))}
        </div>
      ) : !entries?.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12">
          <Calendar className="h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No journal entries yet</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setNewOpen(true)}>
            Write your first entry
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleEntries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => handleEntryClick(entry)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleEntryClick(entry)}
              className="group relative cursor-pointer rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {entry.mood_emoji && <span className="text-xl">{entry.mood_emoji}</span>}
                    <h3 className="truncate text-sm font-medium text-foreground">
                      {entry.title || "Untitled Entry"}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(entry.entry_date), "MMM d, yyyy")}
                  </p>
                  {entry.is_locked ? (
                    <p className="mt-2 text-xs text-muted-foreground/60 italic">🔒 Locked — tap to enter PIN</p>
                  ) : entry.content_preview ? (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/80">
                      {entry.content_preview}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  {entry.is_locked && <Lock className="h-3.5 w-3.5 text-primary" />}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(entry.id); }}
                    className="rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Privacy notice */}
      <div className="flex items-center justify-center gap-1.5 pt-2 pb-1">
        <Shield className="h-3 w-3 text-muted-foreground/50" />
        <p className="text-[10px] text-muted-foreground/50">
          Your journal is completely private. Only you can access your entries.
        </p>
      </div>

      {/* Modals */}
      <JournalEntryModal open={newOpen} onClose={() => setNewOpen(false)} />
      <JournalEntryModal
        open={!!editEntry}
        onClose={() => setEditEntry(null)}
        entry={editEntry}
      />

      {/* PIN verification for locked entries */}
      {pinVerifyEntry && (
        <PinModal
          open={!!pinVerifyEntry}
          onClose={() => setPinVerifyEntry(null)}
          entryId={pinVerifyEntry.id}
          mode="verify"
          onSuccess={() => {
            setEditEntry(pinVerifyEntry);
            setPinVerifyEntry(null);
          }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this journal entry.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
