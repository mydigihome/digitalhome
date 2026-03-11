import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Phone, Mail, Building2, Clock, ChevronRight, X, User, AlertCircle, Import, ArrowLeft, MoreVertical, Bell, FileText, Copy } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, useCreateInteraction, useContactInteractions, Contact } from "@/hooks/useContacts";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "family", label: "Family" },
  { key: "friend", label: "Friends" },
  { key: "professional", label: "Professional" },
  { key: "overdue", label: "Overdue" },
];

const TYPE_COLORS: Record<string, string> = {
  family: "#EC4899",
  friend: "#10B981",
  professional: "#6366F1",
  mentor: "#F59E0B",
};

const TYPE_LABELS: Record<string, string> = {
  family: "FAMILY",
  friend: "FRIEND",
  professional: "PROFESSIONAL",
  mentor: "MENTOR",
};

// Sample contacts shown when DB is empty
const SAMPLE_CONTACTS: Contact[] = [
  {
    id: "sample-1",
    user_id: "",
    name: "Sarah Chen",
    email: "sarah.chen@gmail.com",
    phone: "+1 (555) 234-5678",
    company: "DesignCo",
    title: "Senior Designer",
    photo_url: null,
    relationship_type: "friend",
    last_contacted_date: new Date(Date.now() - 45 * 86400000).toISOString(),
    contact_frequency_days: 30,
    notes: "Sarah is really into watercolor painting and recently started a collection of vintage art supplies. Mention the gallery opening in SoHo next time we talk.",
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-2",
    user_id: "",
    name: "James Wilson",
    email: "james.w@techcorp.com",
    phone: "+1 (555) 345-6789",
    company: "TechCorp",
    title: "CTO",
    photo_url: null,
    relationship_type: "professional",
    last_contacted_date: new Date(Date.now() - 32 * 86400000).toISOString(),
    contact_frequency_days: 30,
    notes: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-3",
    user_id: "",
    name: "Maria Garcia",
    email: "maria.garcia@email.com",
    phone: "+1 (555) 456-7890",
    company: null,
    title: "Sister",
    photo_url: null,
    relationship_type: "family",
    last_contacted_date: new Date(Date.now() - 2 * 86400000).toISOString(),
    contact_frequency_days: 14,
    notes: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-4",
    user_id: "",
    name: "Elena Rodriguez",
    email: "elena.r@outlook.com",
    phone: null,
    company: null,
    title: "Cousin",
    photo_url: null,
    relationship_type: "family",
    last_contacted_date: new Date(Date.now() - 60 * 86400000).toISOString(),
    contact_frequency_days: 30,
    notes: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "sample-5",
    user_id: "",
    name: "Alex Rivers",
    email: "alex@designco.com",
    phone: "+1 (555) 567-8901",
    company: "DesignCo",
    title: "Senior Designer",
    photo_url: null,
    relationship_type: "professional",
    last_contacted_date: new Date(Date.now() - 4 * 86400000).toISOString(),
    contact_frequency_days: 30,
    notes: null,
    created_at: new Date().toISOString(),
  },
];

const INTERACTION_ICONS: Record<string, { icon: typeof Mail; color: string }> = {
  coffee: { icon: Clock, color: "#6366F1" },
  email: { icon: Mail, color: "#EC4899" },
  call: { icon: Phone, color: "#6B7280" },
  general: { icon: Clock, color: "#6366F1" },
};

function getInitials(name: string) {
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.charAt(0).toUpperCase();
}

function getDaysSince(date: string | null): string {
  if (!date) return "Never";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${days}d ago`;
}

function isOverdue(contact: Contact) {
  if (!contact.last_contacted_date) return true;
  const diff = Math.floor((Date.now() - new Date(contact.last_contacted_date).getTime()) / 86400000);
  return diff > (contact.contact_frequency_days || 30);
}

/* ─── Priority Contact Card (horizontal scroll) ─── */
function PriorityCard({ contact, onClick }: { contact: Contact; onClick: () => void }) {
  const daysSince = contact.last_contacted_date
    ? Math.floor((Date.now() - new Date(contact.last_contacted_date).getTime()) / 86400000)
    : null;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[200px] rounded-2xl border border-border bg-card p-5 flex flex-col items-center gap-2 hover:shadow-lg transition-shadow text-center"
    >
      <div className="relative">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold"
          style={{
            backgroundColor: (TYPE_COLORS[contact.relationship_type || ""] || "#6366F1") + "18",
            color: TYPE_COLORS[contact.relationship_type || ""] || "#6366F1",
          }}
        >
          {contact.photo_url ? (
            <img src={contact.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(contact.name)
          )}
        </div>
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card"
          style={{ backgroundColor: TYPE_COLORS[contact.relationship_type || ""] || "#6366F1" }}
        />
      </div>
      <span className="font-semibold text-sm text-foreground">{contact.name}</span>
      <span
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: TYPE_COLORS[contact.relationship_type || ""] || "#6366F1" }}
      >
        {TYPE_LABELS[contact.relationship_type || ""] || "CONTACT"}
      </span>
      {daysSince !== null && (
        <span className="text-xs text-destructive">Last contacted: {daysSince} days ago</span>
      )}
      <div
        className="w-full py-2.5 rounded-xl text-sm font-semibold mt-1"
        style={{
          backgroundColor: TYPE_COLORS[contact.relationship_type || ""] || "#6366F1",
          color: "#FFFFFF",
        }}
      >
        Reach Out
      </div>
    </button>
  );
}

/* ─── Contact List Row ─── */
function ContactRow({ contact, onClick }: { contact: Contact; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 text-left hover:bg-accent/50 rounded-xl px-2 transition-colors"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{
          backgroundColor: (TYPE_COLORS[contact.relationship_type || ""] || "#6366F1") + "18",
          color: TYPE_COLORS[contact.relationship_type || ""] || "#6366F1",
        }}
      >
        {contact.photo_url ? (
          <img src={contact.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          getInitials(contact.name)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm text-foreground block truncate">{contact.name}</span>
        <span className="text-xs text-muted-foreground block truncate">
          {contact.title && contact.company
            ? `${contact.title} • ${contact.company}`
            : contact.title || contact.company || contact.email || "No details"}
        </span>
      </div>
      <span className="text-xs text-muted-foreground flex-shrink-0">{getDaysSince(contact.last_contacted_date)}</span>
    </button>
  );
}

/* ─── Add Contact Modal ─── */
function AddContactModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createContact = useCreateContact();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("friend");

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    await createContact.mutateAsync({ name, email: email || null, phone: phone || null, company: company || null, title: title || null, relationship_type: type });
    toast.success("Contact added");
    setName(""); setEmail(""); setPhone(""); setCompany(""); setTitle("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-foreground">New Contact</h2>
              <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <Input placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <Input placeholder="Title / Role" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                {["family", "friend", "professional", "mentor"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                      type === t ? "text-white" : "bg-secondary text-foreground"
                    }`}
                    style={type === t ? { backgroundColor: TYPE_COLORS[t] } : {}}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} className="w-full mt-5 rounded-xl bg-primary text-primary-foreground" disabled={createContact.isPending}>
              {createContact.isPending ? "Saving..." : "Add Contact"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Contact Detail View (matches reference) ─── */
function ContactDetailView({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const createInteraction = useCreateInteraction();
  const { data: interactions } = useContactInteractions(contact.id);
  const [interactionTitle, setInteractionTitle] = useState("");
  const [interactionDesc, setInteractionDesc] = useState("");
  const [interactionType, setInteractionType] = useState("general");
  const [showLogForm, setShowLogForm] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(contact.notes || "");

  const isSample = contact.id.startsWith("sample-");

  const handleLogInteraction = async () => {
    if (!interactionTitle.trim()) return;
    if (isSample) { toast.info("Sample contact – add a real contact to log interactions"); return; }
    await createInteraction.mutateAsync({
      contact_id: contact.id,
      title: interactionTitle,
      description: interactionDesc || null,
      interaction_type: interactionType,
    });
    setInteractionTitle("");
    setInteractionDesc("");
    setShowLogForm(false);
    toast.success("Interaction logged");
  };

  const handleSaveNotes = async () => {
    if (isSample) { toast.info("Sample contact – add a real contact to edit notes"); return; }
    await updateContact.mutateAsync({ id: contact.id, notes });
    setEditingNotes(false);
    toast.success("Notes saved");
  };

  const handleDelete = async () => {
    if (isSample) { toast.info("Sample contact – can't delete samples"); return; }
    await deleteContact.mutateAsync(contact.id);
    toast.success("Contact deleted");
    onClose();
  };

  const daysSince = contact.last_contacted_date
    ? `Last met ${getDaysSince(contact.last_contacted_date)}`
    : "Never contacted";

  const typeColor = TYPE_COLORS[contact.relationship_type || ""] || "#6366F1";

  // Sample interactions for sample contacts
  const displayInteractions = isSample
    ? [
        { id: "si-1", contact_id: contact.id, user_id: "", interaction_type: "coffee", interaction_date: new Date(Date.now() - 3 * 86400000).toISOString(), title: "Had coffee at Blue Bottle", description: "Caught up on his new project at OpenAI. He seems excited but stressed." },
        { id: "si-2", contact_id: contact.id, user_id: "", interaction_type: "email", interaction_date: new Date(Date.now() - 24 * 86400000).toISOString(), title: "Sent follow-up email", description: "Shared the article about generative AI ethics we discussed." },
        { id: "si-3", contact_id: contact.id, user_id: "", interaction_type: "call", interaction_date: new Date(Date.now() - 42 * 86400000).toISOString(), title: "Brief Check-in Call", description: "12 min call regarding the weekend trip plans." },
      ]
    : interactions || [];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button onClick={onClose} className="p-2 rounded-full hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <button className="p-2 rounded-full hover:bg-accent transition-colors">
          <MoreVertical className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Profile header */}
      <div className="flex flex-col items-center mt-4 px-6">
        <div className="relative">
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-border"
            style={{
              backgroundColor: typeColor + "18",
              color: typeColor,
            }}
          >
            {contact.photo_url ? (
              <img src={contact.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getInitials(contact.name)
            )}
          </div>
          <div
            className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-3 border-background"
            style={{ backgroundColor: "#10B981" }}
          />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mt-3">{contact.name}</h2>
        <span
          className="mt-1 px-3 py-1 rounded-full text-xs font-semibold border"
          style={{ color: typeColor, borderColor: typeColor + "40" }}
        >
          {contact.relationship_type
            ? contact.relationship_type.charAt(0).toUpperCase() + contact.relationship_type.slice(1)
            : "Contact"}
        </span>
        <span className="text-sm text-muted-foreground mt-1">{daysSince}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 px-6 mt-5">
        <button
          onClick={() => setShowLogForm(true)}
          className="flex-1 py-3 rounded-xl flex flex-col items-center gap-1 text-white text-sm font-semibold"
          style={{ backgroundColor: "#6366F1" }}
        >
          <Plus className="w-5 h-5" />
          Log Activity
        </button>
        <button
          onClick={() => toast.info("Reminder feature coming soon")}
          className="flex-1 py-3 rounded-xl flex flex-col items-center gap-1 text-white text-sm font-semibold"
          style={{ backgroundColor: "#EC4899" }}
        >
          <Bell className="w-5 h-5" />
          Reminder
        </button>
        <button
          onClick={() => { setEditingNotes(true); }}
          className="flex-1 py-3 rounded-xl flex flex-col items-center gap-1 text-white text-sm font-semibold bg-foreground"
        >
          <FileText className="w-5 h-5" />
          New Note
        </button>
      </div>

      {/* Contact info */}
      <div className="px-6 mt-6 space-y-0">
        {contact.email && (
          <div className="flex items-center gap-3 py-3 border-b border-border">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground block">EMAIL</span>
              <span className="text-sm text-foreground block truncate">{contact.email}</span>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(contact.email || ""); toast.success("Copied!"); }} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
        {contact.phone && (
          <div className="flex items-center gap-3 py-3 border-b border-border">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground block">PHONE</span>
              <span className="text-sm text-foreground block">{contact.phone}</span>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(contact.phone || ""); toast.success("Copied!"); }} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
        {(contact.company || contact.title) && (
          <div className="flex items-center gap-3 py-3 border-b border-border">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold uppercase text-muted-foreground block">ROLE</span>
              <span className="text-sm text-foreground block truncate">{contact.title}{contact.title && contact.company ? " @ " : ""}{contact.company}</span>
            </div>
          </div>
        )}
      </div>

      {/* Personal Notes */}
      <div className="px-6 mt-6">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-primary" />
          Personal Notes
        </h3>
        {editingNotes ? (
          <div className="space-y-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-xl border border-border bg-card text-sm resize-none min-h-[80px] text-foreground"
              placeholder="Add personal notes about this contact..."
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveNotes} className="bg-primary text-primary-foreground rounded-lg">Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="w-full text-left p-4 rounded-xl text-sm italic"
            style={{ backgroundColor: "#FEF9C3" }}
          >
            <span className="text-foreground/80">
              {contact.notes || `"Add notes about ${contact.name}..."`}
            </span>
            {contact.notes && (
              <span className="block mt-2 text-[10px] font-semibold text-amber-600 uppercase">
                • Updated {getDaysSince(contact.created_at)}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Log Activity Form */}
      <AnimatePresence>
        {showLogForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 mt-4 overflow-hidden">
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <div className="flex gap-2">
                {[
                  { key: "coffee", label: "☕ Coffee" },
                  { key: "email", label: "📧 Email" },
                  { key: "call", label: "📞 Call" },
                  { key: "general", label: "💬 Other" },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setInteractionType(t.key)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      interactionType === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <Input placeholder="What happened?" value={interactionTitle} onChange={(e) => setInteractionTitle(e.target.value)} />
              <Input placeholder="Details (optional)" value={interactionDesc} onChange={(e) => setInteractionDesc(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleLogInteraction} className="bg-primary text-primary-foreground rounded-lg">Log</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowLogForm(false)}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interaction History */}
      <div className="px-6 mt-6 pb-24">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Interaction History
        </h3>
        {displayInteractions.length > 0 ? (
          <div className="space-y-4">
            {displayInteractions.map((i: any) => {
              const iconInfo = INTERACTION_ICONS[i.interaction_type || "general"] || INTERACTION_ICONS.general;
              const Icon = iconInfo.icon;
              return (
                <div key={i.id} className="flex gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: iconInfo.color + "15", color: iconInfo.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-foreground">{i.title}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {format(new Date(i.interaction_date), "MMM d")}
                      </span>
                    </div>
                    {i.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{i.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">No interactions yet</p>
        )}
      </div>

      {/* Delete */}
      <div className="px-6 pb-10">
        <button onClick={handleDelete} className="text-xs text-destructive hover:underline">Delete contact</button>
      </div>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function RelationshipsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { data: dbContacts, isLoading } = useContacts({ type: filter, search });
  const createContact = useCreateContact();

  // Merge sample contacts when DB has none
  const contacts = (dbContacts && dbContacts.length > 0) ? dbContacts : SAMPLE_CONTACTS;

  // Priority contacts: overdue 30+ days
  const overdueContacts = contacts.filter(isOverdue);

  // Group by type
  const grouped = contacts.reduce<Record<string, Contact[]>>((acc, c) => {
    const key = c.relationship_type || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const importPhone = async () => {
    try {
      if (!('contacts' in navigator && 'ContactsManager' in window)) {
        toast.error("Contact Picker not supported on this device/browser. Try Chrome on Android or Safari on iOS.");
        return;
      }
      const results = await (navigator as any).contacts.select(['name', 'email', 'tel'], { multiple: true });
      if (!results || results.length === 0) return;
      let imported = 0;
      for (const c of results) {
        const name = c.name?.[0];
        if (!name) continue;
        await createContact.mutateAsync({
          name,
          email: c.email?.[0] || null,
          phone: c.tel?.[0] || null,
          relationship_type: "friend",
        });
        imported++;
      }
      toast.success(`Imported ${imported} contacts`);
    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast.info("Import cancelled");
      } else {
        toast.error("Phone import not supported on this browser");
      }
    }
  };

  const importLinkedIn = () => {
    toast.info("LinkedIn OAuth requires a LinkedIn Developer App. Configure VITE_LINKEDIN_CLIENT_ID to enable.", { duration: 5000 });
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Header with gradient */}
        <div
          className="rounded-b-[32px] px-6 pt-8 pb-6"
          style={{ background: "linear-gradient(135deg, hsl(var(--accent)), hsl(var(--muted)))" }}
        >
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-card/80 backdrop-blur flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <MoreVertical className="w-4 h-4 text-muted-foreground absolute right-6 top-8 cursor-pointer" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-semibold text-foreground mt-4 italic">Relationships</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your personal and professional relationships</p>

            {/* Search */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-xl bg-card/80 backdrop-blur border-border"
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-28">
          {/* Priority Contacts */}
          {overdueContacts.length > 0 && filter !== "overdue" && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-foreground">Priority Contacts</h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
                  {overdueContacts.length} Overdue
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
                {overdueContacts.slice(0, 6).map((c) => (
                  <PriorityCard key={c.id} contact={c} onClick={() => setSelectedContact(c)} />
                ))}
              </div>
            </div>
          )}

          {/* Filter pills */}
          <div className="flex gap-2 mt-5 overflow-x-auto pb-2 scrollbar-hide">
            {FILTERS.map((f) => {
              const isActive = filter === f.key;
              const isOverdueFilter = f.key === "overdue";
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? isOverdueFilter
                        ? "bg-destructive/10 text-destructive border-destructive/30"
                        : "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Contact
            </button>
            <button
              onClick={importLinkedIn}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" /> Import LinkedIn
            </button>
            <button
              onClick={importPhone}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Import Phone
            </button>
          </div>

          {/* Contact list grouped */}
          {isLoading ? (
            <div className="mt-8 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />)}
            </div>
          ) : contacts.length === 0 ? (
            <div className="mt-16 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No contacts yet</p>
              <Button onClick={() => setShowAdd(true)} className="mt-4 rounded-xl bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-1" /> Add your first contact
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {Object.entries(grouped).map(([type, list]) => (
                <div key={type}>
                  <h3
                    className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: TYPE_COLORS[type] || "hsl(var(--muted-foreground))" }}
                  >
                    {TYPE_LABELS[type] || type.toUpperCase()}
                  </h3>
                  <div className="space-y-0.5">
                    {list.map((c) => (
                      <ContactRow key={c.id} contact={c} onClick={() => setSelectedContact(c)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <AddContactModal open={showAdd} onClose={() => setShowAdd(false)} />

      <AnimatePresence>
        {selectedContact && (
          <ContactDetailView contact={selectedContact} onClose={() => setSelectedContact(null)} />
        )}
      </AnimatePresence>
    </AppShell>
  );
}
