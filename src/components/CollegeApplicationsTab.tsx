import { useState, useCallback, useRef } from "react";
import { Plus, Trash2, Copy, ExternalLink, GraduationCap, Lightbulb, ArrowUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import {
  useCollegeApplications, useCreateCollegeApp, useUpdateCollegeApp, useDeleteCollegeApp,
  type CollegeApplication,
} from "@/hooks/useCollegeApplications";

const statusOptions = [
  { value: "not_started", label: "Not Started", color: "bg-secondary text-muted-foreground" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "submitted", label: "Submitted", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "interview", label: "Interview", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  { value: "accepted", label: "Accepted", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { value: "waitlisted", label: "Waitlisted", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
];

function getRowBg(app: CollegeApplication): string {
  if (app.status === "accepted") return "bg-green-50 dark:bg-green-900/10";
  if (app.status === "rejected") return "bg-secondary/50";
  if (app.status === "submitted") return "bg-blue-50 dark:bg-blue-900/10";
  if (app.final_deadline) {
    const days = differenceInDays(new Date(app.final_deadline), new Date());
    if (days <= 7) return "bg-red-50 dark:bg-red-900/10";
    if (days <= 14) return "bg-orange-50 dark:bg-orange-900/10";
    if (days <= 30) return "bg-yellow-50 dark:bg-yellow-900/10";
  }
  return "";
}

function StatusBadge({ status, onChange }: { status: string; onChange: (v: string) => void }) {
  const opt = statusOptions.find((o) => o.value === status) || statusOptions[0];
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      className={cn("rounded-full px-2 py-0.5 text-xs font-medium border-0 cursor-pointer appearance-none text-center", opt.color)}
      style={{ minWidth: 90 }}
    >
      {statusOptions.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export default function CollegeApplicationsTab() {
  const { data: prefs } = useUserPreferences();
  const themeColor = prefs?.theme_color || "#8B5CF6";
  const navigate = useNavigate();
  const { data: apps = [] } = useCollegeApplications();
  const createApp = useCreateCollegeApp();
  const updateApp = useUpdateCollegeApp();
  const deleteApp = useDeleteCollegeApp();

  const [showForm, setShowForm] = useState(false);
  const [sortKey, setSortKey] = useState<string>("final_deadline");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [form, setForm] = useState({
    college_name: "", status: "not_started", contact_name: "", contact_email: "",
    open_house_date: "", early_action_date: "", final_deadline: "", school_link: "",
    rec_letters: "", notes: "",
  });

  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const debouncedUpdate = useCallback((id: string, field: string, value: any) => {
    if (debounceRef.current[id + field]) clearTimeout(debounceRef.current[id + field]);
    debounceRef.current[id + field] = setTimeout(() => {
      updateApp.mutate({ id, [field]: value || null });
    }, 1500);
  }, [updateApp]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = [...apps].sort((a, b) => {
    const av = (a as any)[sortKey] || "";
    const bv = (b as any)[sortKey] || "";
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const handleSubmit = () => {
    if (!form.college_name || !form.final_deadline) { toast.error("College name and final deadline required"); return; }
    createApp.mutate({
      college_name: form.college_name,
      status: form.status,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      open_house_date: form.open_house_date || null,
      early_action_date: form.early_action_date || null,
      final_deadline: form.final_deadline,
      school_link: form.school_link || null,
      rec_letters: form.rec_letters || null,
      notes: form.notes || null,
    }, {
      onSuccess: () => {
        toast.success("College added");
        setForm({ college_name: "", status: "not_started", contact_name: "", contact_email: "", open_house_date: "", early_action_date: "", final_deadline: "", school_link: "", rec_letters: "", notes: "" });
        setShowForm(false);
      },
    });
  };

  const duplicateApp = (app: CollegeApplication) => {
    createApp.mutate({
      college_name: app.college_name + " (copy)",
      status: "not_started",
      contact_name: app.contact_name,
      contact_email: app.contact_email,
      open_house_date: app.open_house_date,
      early_action_date: app.early_action_date,
      final_deadline: app.final_deadline,
      school_link: app.school_link,
      rec_letters: app.rec_letters,
      notes: app.notes,
    }, { onSuccess: () => toast.success("Duplicated") });
  };

  const SortHeader = ({ label, field }: { label: string; field: string }) => (
    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap" onClick={() => handleSort(field)}>
      <span className="inline-flex items-center gap-1">{label} <ArrowUpDown className="h-3 w-3" /></span>
    </th>
  );

  if (apps.length === 0 && !showForm) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <GraduationCap className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="text-lg font-medium text-foreground">No colleges added yet</p>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Click + Add College to get started</p>
        <Button onClick={() => setShowForm(true)} style={{ backgroundColor: themeColor }}>
          <Plus className="h-4 w-4 mr-1" /> Add College
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">College Applications</h2>
          <p className="text-sm text-muted-foreground">Track your college application journey</p>
        </div>
        <Button onClick={() => setShowForm(true)} style={{ backgroundColor: themeColor }}>
          <Plus className="h-4 w-4 mr-1" /> Add College
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <SortHeader label="Status" field="status" />
              <SortHeader label="College Name" field="college_name" />
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Contact</th>
              <SortHeader label="Open House" field="open_house_date" />
              <SortHeader label="Early Action" field="early_action_date" />
              <SortHeader label="Final Deadline" field="final_deadline" />
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Link</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Rec Letters</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Notes</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((app) => (
              <tr key={app.id} className={cn("border-t border-border transition-colors", getRowBg(app))}>
                <td className="px-3 py-2"><StatusBadge status={app.status} onChange={(v) => updateApp.mutate({ id: app.id, status: v })} /></td>
                <td className="px-3 py-2">
                  <input defaultValue={app.college_name} className="bg-transparent font-medium text-foreground border-0 outline-none w-full min-w-[120px]" onBlur={(e) => { if (e.target.value !== app.college_name) debouncedUpdate(app.id, "college_name", e.target.value); }} />
                </td>
                <td className="px-3 py-2">
                  <div className="space-y-0.5">
                    <input defaultValue={app.contact_name || ""} placeholder="Name" className="bg-transparent text-foreground border-0 outline-none w-full text-xs min-w-[80px]" onBlur={(e) => debouncedUpdate(app.id, "contact_name", e.target.value)} />
                    <input defaultValue={app.contact_email || ""} placeholder="Email" className="bg-transparent text-muted-foreground border-0 outline-none w-full text-xs min-w-[80px]" onBlur={(e) => debouncedUpdate(app.id, "contact_email", e.target.value)} />
                  </div>
                </td>
                <td className="px-3 py-2"><input type="date" defaultValue={app.open_house_date || ""} className="bg-transparent text-foreground border-0 outline-none text-xs" onBlur={(e) => debouncedUpdate(app.id, "open_house_date", e.target.value)} /></td>
                <td className="px-3 py-2"><input type="date" defaultValue={app.early_action_date || ""} className="bg-transparent text-foreground border-0 outline-none text-xs" onBlur={(e) => debouncedUpdate(app.id, "early_action_date", e.target.value)} /></td>
                <td className="px-3 py-2"><input type="date" defaultValue={app.final_deadline} className="bg-transparent text-foreground border-0 outline-none text-xs" onBlur={(e) => debouncedUpdate(app.id, "final_deadline", e.target.value)} /></td>
                <td className="px-3 py-2">
                  {app.school_link ? (
                    <a href={app.school_link.startsWith("http") ? app.school_link : `https://${app.school_link}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80"><ExternalLink className="h-4 w-4" /></a>
                  ) : (
                    <input placeholder="URL" className="bg-transparent text-muted-foreground border-0 outline-none w-full text-xs min-w-[60px]" onBlur={(e) => debouncedUpdate(app.id, "school_link", e.target.value)} />
                  )}
                </td>
                <td className="px-3 py-2">
                  <input defaultValue={app.rec_letters || ""} placeholder="0/0" className="bg-transparent text-foreground border-0 outline-none w-16 text-xs" onBlur={(e) => debouncedUpdate(app.id, "rec_letters", e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <input defaultValue={app.notes || ""} placeholder="Notes..." className="bg-transparent text-foreground border-0 outline-none w-full text-xs min-w-[80px]" title={app.notes || ""} onBlur={(e) => debouncedUpdate(app.id, "notes", e.target.value)} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => duplicateApp(app)} className="p-1 text-muted-foreground hover:text-foreground" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (confirm(`Delete "${app.college_name}"?`)) deleteApp.mutate(app.id); }} className="p-1 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AppTrack Tip */}
      <div className="mt-8 p-4 rounded-xl bg-secondary/50 border-l-[3px]" style={{ borderLeftColor: themeColor }}>
        <div className="flex items-start gap-2">
          <Lightbulb className="h-[18px] w-[18px] mt-0.5 shrink-0" style={{ color: themeColor }} />
          <p className="text-[13px] text-muted-foreground">
            Want to take this to the next level?{" "}
            <button onClick={() => navigate("/settings?tab=resources&category=College")} className="font-medium hover:underline" style={{ color: themeColor }}>
              Try AppTrack.ai →
            </button>
            {" "}for AI-powered application tracking
          </p>
        </div>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-[400px] rounded-2xl bg-card p-6 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Add College</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1"><Label>College Name *</Label><Input value={form.college_name} onChange={(e) => setForm((p) => ({ ...p, college_name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label>Final Deadline *</Label><Input type="date" value={form.final_deadline} onChange={(e) => setForm((p) => ({ ...p, final_deadline: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Contact Name</Label><Input value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Open House</Label><Input type="date" value={form.open_house_date} onChange={(e) => setForm((p) => ({ ...p, open_house_date: e.target.value }))} /></div>
                <div className="space-y-1"><Label>Early Action</Label><Input type="date" value={form.early_action_date} onChange={(e) => setForm((p) => ({ ...p, early_action_date: e.target.value }))} /></div>
              </div>
              <div className="space-y-1"><Label>School Link</Label><Input value={form.school_link} onChange={(e) => setForm((p) => ({ ...p, school_link: e.target.value }))} placeholder="https://..." /></div>
              <div className="space-y-1"><Label>Rec Letters</Label><Input value={form.rec_letters} onChange={(e) => setForm((p) => ({ ...p, rec_letters: e.target.value }))} placeholder="0/3" /></div>
              <div className="space-y-1"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} maxLength={500} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={createApp.isPending} className="flex-1" style={{ backgroundColor: themeColor }}>Add College</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
