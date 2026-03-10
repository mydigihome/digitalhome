import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Phone, Mail, Building2, Clock, ChevronRight, X, User, AlertCircle, Import } from "lucide-react";
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
  { key: "mentor", label: "Mentors" },
  { key: "overdue", label: "Overdue" },
];

const TYPE_COLORS: Record<string, string> = {
  family: "#EC4899",
  friend: "#10B981",
  professional: "#6366F1",
  mentor: "#F59E0B",
};

function ContactCard({ contact, onClick }: { contact: Contact; onClick: () => void }) {
  const isOverdue = (() => {
    if (!contact.last_contacted_date) return true;
    const diff = Math.floor((Date.now() - new Date(contact.last_contacted_date).getTime()) / (1000 * 60 * 60 * 24));
    return diff > (contact.contact_frequency_days || 30);
  })();

  const daysSince = contact.last_contacted_date
    ? Math.floor((Date.now() - new Date(contact.last_contacted_date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-card border border-slate-100 dark:border-border hover:shadow-md transition-all text-left"
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
        style={{ backgroundColor: TYPE_COLORS[contact.relationship_type || ""] || "#6366F1" }}
      >
        {contact.photo_url ? (
          <img src={contact.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          contact.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground truncate">{contact.name}</span>
          {isOverdue && <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {contact.company || contact.title || contact.email || "No details"}
        </div>
        {daysSince !== null && (
          <div className={`text-[10px] mt-0.5 ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
            {daysSince === 0 ? "Today" : `${daysSince}d ago`}
          </div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}

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
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full max-w-md bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">New Contact</h2>
              <button onClick={onClose}><X className="w-5 h-5" /></button>
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
                      type === t ? "text-white" : "bg-slate-100 dark:bg-secondary text-foreground"
                    }`}
                    style={type === t ? { backgroundColor: TYPE_COLORS[t] } : {}}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleSave} className="w-full mt-5 rounded-xl" style={{ backgroundColor: "#6366F1" }} disabled={createContact.isPending}>
              {createContact.isPending ? "Saving..." : "Add Contact"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ContactDetailModal({ contact, open, onClose }: { contact: Contact | null; open: boolean; onClose: () => void }) {
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const createInteraction = useCreateInteraction();
  const { data: interactions } = useContactInteractions(contact?.id || null);
  const [interactionTitle, setInteractionTitle] = useState("");

  if (!contact) return null;

  const handleLogInteraction = async () => {
    if (!interactionTitle.trim()) return;
    await createInteraction.mutateAsync({ contact_id: contact.id, title: interactionTitle, interaction_type: "general" });
    setInteractionTitle("");
    toast.success("Interaction logged");
  };

  const handleDelete = async () => {
    await deleteContact.mutateAsync(contact.id);
    toast.success("Contact deleted");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="w-full max-w-md bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: TYPE_COLORS[contact.relationship_type || ""] || "#6366F1" }}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{contact.name}</h2>
                  <p className="text-xs text-muted-foreground capitalize">{contact.relationship_type || "Contact"}</p>
                </div>
              </div>
              <button onClick={onClose}><X className="w-5 h-5" /></button>
            </div>

            {(contact.email || contact.phone || contact.company) && (
              <div className="space-y-2 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-secondary">
                {contact.email && <div className="flex items-center gap-2 text-sm"><Mail className="w-3.5 h-3.5 text-muted-foreground" />{contact.email}</div>}
                {contact.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{contact.phone}</div>}
                {contact.company && <div className="flex items-center gap-2 text-sm"><Building2 className="w-3.5 h-3.5 text-muted-foreground" />{contact.company}{contact.title ? ` · ${contact.title}` : ""}</div>}
              </div>
            )}

            {contact.notes && <p className="text-sm text-muted-foreground mb-4">{contact.notes}</p>}

            <div className="mb-4">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Log Interaction</h3>
              <div className="flex gap-2">
                <Input placeholder="Coffee chat, call, email..." value={interactionTitle} onChange={(e) => setInteractionTitle(e.target.value)} className="flex-1" />
                <Button size="sm" onClick={handleLogInteraction} style={{ backgroundColor: "#6366F1" }}>Log</Button>
              </div>
            </div>

            {interactions && interactions.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">History</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {interactions.map((i) => (
                    <div key={i.id} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-slate-50 dark:bg-secondary">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 truncate">{i.title}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(i.interaction_date), { addSuffix: true })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleDelete} className="text-xs text-red-500 hover:underline">Delete contact</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function RelationshipsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { data: contacts, isLoading } = useContacts({ type: filter, search });
  const createContact = useCreateContact();

  // Priority contacts: overdue 30+ days
  const overdueContacts = (contacts || []).filter((c) => {
    if (!c.last_contacted_date) return true;
    const diff = Math.floor((Date.now() - new Date(c.last_contacted_date).getTime()) / (1000 * 60 * 60 * 24));
    return diff > (c.contact_frequency_days || 30);
  });

  // Group by type
  const grouped = (contacts || []).reduce<Record<string, Contact[]>>((acc, c) => {
    const key = c.relationship_type || "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(c);
    return acc;
  }, {});

  const importPhone = async () => {
    try {
      if (!('contacts' in navigator && 'ContactsManager' in window)) {
        toast.error("Contact Picker not supported on this device/browser");
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
      if (e.name !== 'TypeError') toast.error("Import cancelled or not supported");
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
        {/* Header */}
        <div className="rounded-b-[40px] px-6 pt-10 pb-8" style={{ background: "linear-gradient(135deg, #EEF2FF, #FDF2F8)" }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-5xl font-semibold">Relationships</h1>
                <p className="text-sm text-muted-foreground mt-1">Stay connected</p>
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform flex-shrink-0"
                style={{ backgroundColor: "#6366F1" }}
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl border-slate-200" />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-28">
          {/* Priority - overdue */}
          {overdueContacts.length > 0 && filter !== "overdue" && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase text-red-500 mb-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Needs attention
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {overdueContacts.slice(0, 8).map((c) => (
                  <button key={c.id} onClick={() => setSelectedContact(c)} className="flex-shrink-0 flex flex-col items-center gap-1 w-16">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-red-200" style={{ backgroundColor: TYPE_COLORS[c.relationship_type || ""] || "#6366F1" }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[10px] text-foreground truncate w-full text-center">{c.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filter pills */}
          <div className="flex gap-2 mt-5 overflow-x-auto pb-2 scrollbar-hide">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  filter === f.key ? "text-white" : "bg-white dark:bg-card text-foreground border border-slate-200"
                }`}
                style={filter === f.key ? { backgroundColor: "#6366F1" } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Import buttons */}
          <div className="flex gap-2 mt-4">
            <button onClick={() => toast("LinkedIn import coming soon!")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-xs text-muted-foreground hover:border-indigo-300 transition-colors">
              <Import className="w-3 h-3" /> Import LinkedIn
            </button>
            <button onClick={importPhone} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-300 text-xs text-muted-foreground hover:border-indigo-300 transition-colors">
              <Phone className="w-3 h-3" /> Import Phone
            </button>
          </div>

          {/* Contact list */}
          {isLoading ? (
            <div className="mt-8 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : (contacts || []).length === 0 ? (
            <div className="mt-16 text-center">
              <User className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No contacts yet</p>
              <Button onClick={() => setShowAdd(true)} className="mt-4 rounded-xl" style={{ backgroundColor: "#6366F1" }}>
                <Plus className="w-4 h-4 mr-1" /> Add your first contact
              </Button>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {Object.entries(grouped).map(([type, list]) => (
                <div key={type}>
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 capitalize">{type}</h3>
                  <div className="space-y-2">
                    {list.map((c) => (
                      <ContactCard key={c.id} contact={c} onClick={() => setSelectedContact(c)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddContactModal open={showAdd} onClose={() => setShowAdd(false)} />
      <ContactDetailModal contact={selectedContact} open={!!selectedContact} onClose={() => setSelectedContact(null)} />
    </AppShell>
  );
}
