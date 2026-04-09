import { useState, useEffect } from "react";
import PriorityContactCard from "../cards/PriorityContactCard";
import ContactRow from "../cards/ContactRow";
import AddContactModal from "../modals/AddContactModal";
import ContactDetailPanel from "../panels/ContactDetailPanel";
import AIEmailWidget from "../panels/AIEmailWidget";
import AITasksWidget from "../panels/AITasksWidget";
import { useContacts, useCreateContact, useUpdateContact, type Contact } from "@/hooks/useContacts";
import { toast } from "sonner";
import PremiumGate from "@/components/PremiumGate";
import { Loader2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";

const FILTERS = ["All", "Family", "Friends", "Professional", "Digi Home"];

function contactLastDays(c: Contact): string {
  if (!c.last_contacted_date) return "Never";
  try {
    return formatDistanceToNow(new Date(c.last_contacted_date), { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

function daysSinceLast(c: Contact): number {
  if (!c.last_contacted_date) return 999;
  return Math.floor((Date.now() - new Date(c.last_contacted_date).getTime()) / (1000 * 60 * 60 * 24));
}

interface Props {
  onSwitchToEmails: () => void;
  onCompose: (to: string, name: string) => void;
}

export default function OverviewView({ onSwitchToEmails, onCompose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  const { data: contacts = [], isLoading } = useContacts();

  // Priority stars loaded from DB (contacts.priority column)
  const priorityStars: Record<string, boolean> = {};
  contacts.forEach(c => {
    priorityStars[c.id] = (c as any).priority === true;
  });

  const toggleStar = async (id: string) => {
    const current = priorityStars[id] ?? false;
    const newVal = !current;

    // Optimistic update via queryClient
    queryClient.setQueryData(["contacts", user?.id, undefined], (old: any) => {
      if (!Array.isArray(old)) return old;
      return old.map((c: any) => c.id === id ? { ...c, priority: newVal } : c);
    });

    toast.success(newVal ? "Added to priority" : "Removed from priority");

    const { error } = await (supabase as any)
      .from("contacts")
      .update({ priority: newVal })
      .eq("id", id);

    if (error) {
      console.error("Failed to save priority:", error);
      toast.error("Failed to save priority");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (filter === "All") return true;
    if (filter === "Digi Home") return c.relationship_type === "digihome" || c.imported_from === "digihome";
    return c.relationship_type === filter;
  });

  const activeContact = activeContactId
    ? contacts.find(c => c.id === activeContactId) || null
    : null;

  const suggestedContact = contacts.length > 0
    ? contacts.reduce((a, b) => daysSinceLast(a) > daysSinceLast(b) ? a : b)
    : null;

  const openDetail = (c: Contact) => {
    setDetailContact(c);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[#f3f3f8] dark:bg-[#252836] flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-[#767586]" />
        </div>
        <h3 className="font-bold text-lg text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          No contacts yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Import from LinkedIn or Gmail to get started, or add contacts manually.
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-full px-6 py-2.5 font-bold text-sm text-white"
          style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
        >
          + Add Contact
        </button>
        <AddContactModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={(data) => {
            createContact.mutate(data);
            toast.success(`${data.name} added`);
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
      {/* LEFT COLUMN */}
      <div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              All Contacts
            </h2>
            <span className="text-xs text-muted-foreground">{contacts.length} contacts</span>
          </div>
          <div className="flex gap-2 mb-4">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  filter === f ? "bg-[#4648d4] text-white" : "bg-[#f3f3f8] dark:bg-[#252836] text-[#767586]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {filter === "Digi Home" && filteredContacts.length === 0 && (
            <div className="bg-[#f3f3f8] dark:bg-[#252836] rounded-[20px] px-5 py-4 mt-2 mb-3">
              <p className="text-xs text-muted-foreground">
                Digi Home contacts appear here automatically when you share a project with another user.
              </p>
            </div>
          )}
          <div className="space-y-2">
            {filteredContacts.map((c) => (
              <ContactRow
                key={c.id}
                contact={{
                  id: c.id,
                  name: c.name,
                  type: c.relationship_type || "Professional",
                  role: c.title || c.company || "",
                  company: c.company || undefined,
                  lastDays: contactLastDays(c),
                  isPriority: priorityStars[c.id] ?? false,
                  isDigiHome: c.relationship_type === "digihome" || c.imported_from === "digihome",
                }}
                onToggleStar={toggleStar}
                onClick={() => openDetail(c)}
              />
            ))}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full border-2 border-dashed border-[#4648d4]/30 rounded-[20px] py-3 text-[#4648d4] font-bold text-sm mt-4 hover:bg-[#4648d4]/5 transition-colors"
          >
            + Add Contact
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN — always visible */}
      <div className="hidden md:block">
        <div className="sticky top-6 space-y-4">
          <PremiumGate feature="AI Email Compose" blur>
            <AIEmailWidget
              contact={activeContact ? {
                id: activeContact.id,
                name: activeContact.name,
                email: activeContact.email || "",
                role: activeContact.title || "",
                lastContactDays: daysSinceLast(activeContact),
              } : null}
              suggestedContact={suggestedContact ? {
                id: suggestedContact.id,
                name: suggestedContact.name,
                email: suggestedContact.email || "",
                role: suggestedContact.title || "",
                lastContactDays: daysSinceLast(suggestedContact),
              } : undefined}
            />
          </PremiumGate>
          <AITasksWidget activeContactId={activeContactId} />
        </div>
      </div>

      {/* Mobile: right panel below */}
      <div className="block md:hidden space-y-4">
        <PremiumGate feature="AI Email Compose" blur>
          <AIEmailWidget
            contact={activeContact ? {
              id: activeContact.id,
              name: activeContact.name,
              email: activeContact.email || "",
              role: activeContact.title || "",
              lastContactDays: daysSinceLast(activeContact),
            } : null}
            suggestedContact={suggestedContact ? {
              id: suggestedContact.id,
              name: suggestedContact.name,
              email: suggestedContact.email || "",
              role: suggestedContact.title || "",
              lastContactDays: daysSinceLast(suggestedContact),
            } : undefined}
          />
        </PremiumGate>
        <AITasksWidget activeContactId={activeContactId} />
      </div>

      {detailContact && (
        <ContactDetailPanel
          contact={{
            id: detailContact.id,
            name: detailContact.name,
            role: detailContact.title || "",
            company: detailContact.company || undefined,
            type: detailContact.relationship_type || "Professional",
            isPriority: priorityStars[detailContact.id] ?? false,
            emailCount: 0,
            meetingCount: 0,
            daysSince: daysSinceLast(detailContact),
            linkedProjects: [],
            recentEmails: [],
            notes: detailContact.notes || "",
          }}
          onClose={() => setDetailContact(null)}
          onToggleStar={toggleStar}
          onEmail={() => onCompose(detailContact.email || "", detailContact.name)}
          onNotesChange={(id, notes) => {
            updateContact.mutate({ id, notes });
            toast.success("Notes saved");
          }}
        />
      )}

      <AddContactModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(data) => {
          createContact.mutate(data);
          toast.success(`${data.name} added`);
        }}
      />
    </div>
  );
}
