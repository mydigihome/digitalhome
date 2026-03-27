import { useState } from "react";
import PriorityContactCard from "../cards/PriorityContactCard";
import ContactRow from "../cards/ContactRow";
import AddContactModal from "../modals/AddContactModal";
import ContactDetailPanel from "../panels/ContactDetailPanel";
import AIEmailWidget from "../panels/AIEmailWidget";
import { useCreateContact } from "@/hooks/useContacts";
import { toast } from "sonner";

const MOCK_PRIORITY = [
  {
    id: "p1", name: "Sarah Johnson", role: "Real Estate Agent", location: "Denver, CO",
    isPriority: true, whyPriority: ["Linked to Buy Investment Property project", "Can save you $10k in realtor fees"],
    lastContactDays: 14, recentEmail: "Found 3 properties that match your ROI criteria...", email: "sarah@realestate.com",
  },
  {
    id: "p2", name: "Mike Thompson", role: "Contractor", location: "Austin, TX",
    isPriority: true, whyPriority: ["Kitchen remodel quote expires in 48 hours", "Approval needed for electrical work"],
    lastContactDays: 3, recentEmail: "Just checking if you had a chance to look at the quartzite...", email: "mike@contractor.com",
  },
];

const MOCK_EMAILS_PRIORITY = [
  { id: "pe1", sender: "Sarah Johnson", initial: "S", subject: "Updated Investment ROI Sheet", snippet: "Hi Alex, I've attached the latest figures for the...", time: "2h ago", email: "sarah@realestate.com" },
  { id: "pe2", sender: "Mike Thompson", initial: "M", subject: "Kitchen remodel materials", snippet: "Just checking if you had a chance to look at the quar...", time: "Yesterday", email: "mike@contractor.com" },
];

const MOCK_ALL_CONTACTS = [
  { id: "c1", name: "Elena Rodriguez", type: "Professional", role: "Design Consultant", company: "Studio ER", lastDays: "3d ago", isPriority: false },
  { id: "c2", name: "David Miller", type: "Family", role: "Brother", lastDays: "5h ago", isPriority: false },
  { id: "c3", name: "James Chen", type: "Professional", role: "Financial Advisor", company: "Meridian Capital", lastDays: "12d ago", isPriority: false },
  { id: "c4", name: "Maria Santos", type: "Friends", role: "College Friend", lastDays: "2d ago", isPriority: false },
  { id: "c5", name: "Robert Kim", type: "Professional", role: "Mortgage Broker", company: "First Capital", lastDays: "21d ago", isPriority: false },
  { id: "c6", name: "Alex Rivera", type: "Digi Home", role: "Project Collaborator", company: "Interior Design 2024", lastDays: "1h ago", isPriority: false, isDigiHome: true },
];

const FILTERS = ["All", "Family", "Friends", "Professional", "Digi Home"];

const MOCK_DETAIL = {
  id: "p1", name: "Sarah Johnson", role: "Real Estate Agent", company: "Denver Realty", type: "Professional",
  isPriority: true, emailCount: 12, meetingCount: 3, daysSince: 14,
  linkedProjects: ["Buy Investment Property"],
  recentEmails: [
    { subject: "Updated Investment ROI Sheet", date: "2h ago" },
    { subject: "Property viewing - Thursday 3pm", date: "2d ago" },
    { subject: "Market analysis Q1", date: "1w ago" },
  ],
  notes: "Great contact for Denver market. Has 15+ years experience. Specializes in investment properties.",
};

interface Props {
  onSwitchToEmails: () => void;
  onCompose: (to: string, name: string) => void;
}

export default function OverviewView({ onSwitchToEmails, onCompose }: Props) {
  const [filter, setFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailContact, setDetailContact] = useState<typeof MOCK_DETAIL | null>(null);
  const [emailWidget, setEmailWidget] = useState<{ id: string; name: string; email: string; lastContactDays: number } | null>(null);
  const [priorityStars, setPriorityStars] = useState<Record<string, boolean>>({
    p1: true, p2: true, c1: false, c2: false, c3: false, c4: false, c5: false,
  });
  const createContact = useCreateContact();

  const toggleStar = (id: string) => {
    setPriorityStars((prev) => ({ ...prev, [id]: !prev[id] }));
    toast.success(priorityStars[id] ? "Removed from priority" : "Added to priority");
  };

  const filteredContacts = MOCK_ALL_CONTACTS.filter(
    (c) => filter === "All" || c.type === filter
  );

  const openEmailWidget = (contactId: string) => {
    const priority = MOCK_PRIORITY.find((c) => c.id === contactId);
    if (priority) {
      setEmailWidget({ id: priority.id, name: priority.name, email: priority.email, lastContactDays: priority.lastContactDays });
    }
  };

  return (
    <div className={detailContact ? "grid grid-cols-[1fr_420px] gap-6" : ""}>
      <div>
        {/* Priority contacts + email widget */}
        <div className={emailWidget ? "grid grid-cols-[1fr_380px] gap-6 transition-all duration-300" : ""}>
          <div>
            {/* Priority Contacts */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-xl text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Priority Contacts
                </h2>
                <span className="text-[10px] text-[#767586] uppercase tracking-widest font-bold">THIS SEASON · Q1 2026</span>
              </div>
              <button className="text-[#4648d4] text-sm font-bold">View All</button>
            </div>
            <div className="space-y-3">
              {MOCK_PRIORITY.map((c) => (
                <PriorityContactCard
                  key={c.id}
                  contact={{ ...c, isPriority: priorityStars[c.id] ?? true }}
                  onToggleStar={toggleStar}
                  onEmail={() => openEmailWidget(c.id)}
                  onSchedule={() => toast.info("Schedule feature coming soon")}
                  onEdit={() => setDetailContact(MOCK_DETAIL)}
                  onEmailClick={onSwitchToEmails}
                />
              ))}
            </div>

            {/* Priority Emails */}
            <div className="mt-6">
              <h2 className="font-bold text-lg text-[#1a1c1f] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Priority Emails
              </h2>
              <p className="text-xs text-[#767586] mb-3">From your priority contacts</p>
              <div className="space-y-2">
                {MOCK_EMAILS_PRIORITY.map((em) => (
                  <div
                    key={em.id}
                    className="group bg-white rounded-[20px] px-4 py-3 flex items-center gap-3"
                    style={{ boxShadow: "inset 3px 0 0 #4648d4, 0 4px 16px rgba(70,69,84,0.04)" }}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#e1e0ff] text-[#4648d4] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {em.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-xs text-[#1a1c1f]">{em.sender}</span>
                      <span className="text-xs text-[#1a1c1f] ml-2 truncate">{em.subject}</span>
                    </div>
                    <span className="text-[10px] text-[#767586] flex-shrink-0">{em.time}</span>
                    <div className="hidden group-hover:flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => onCompose(em.email, em.sender)}
                        className="text-[10px] font-bold text-[#4648d4]"
                      >
                        Reply
                      </button>
                      <button className="text-[10px] font-bold text-[#767586]">Archive</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Email Widget */}
          {emailWidget && (
            <div className="sticky top-8">
              <AIEmailWidget contact={emailWidget} onClose={() => setEmailWidget(null)} />
            </div>
          )}
        </div>

        {/* All Contacts */}
        <div className="mt-8">
          <h2 className="font-bold text-xl text-[#1a1c1f] mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            All Contacts
          </h2>
          <div className="flex gap-2 mb-4">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  filter === f ? "bg-[#4648d4] text-white" : "bg-[#f3f3f8] text-[#767586]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {filter === "Digi Home" && filteredContacts.filter(c => c.type === "Digi Home").length <= 1 && (
            <div className="bg-[#f3f3f8] rounded-[20px] px-5 py-4 mt-2 mb-3">
              <p className="text-xs text-[#767586]">
                🏠 Digi Home contacts appear here automatically when you share a project or content planner with another user.
              </p>
            </div>
          )}
          <div className="space-y-2">
            {filteredContacts.map((c) => (
              <ContactRow
                key={c.id}
                contact={{ ...c, isPriority: priorityStars[c.id] ?? false }}
                onToggleStar={toggleStar}
                onClick={() => setDetailContact({ ...MOCK_DETAIL, id: c.id, name: c.name, role: c.role, company: c.company })}
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

      {detailContact && (
        <ContactDetailPanel
          contact={detailContact}
          onClose={() => setDetailContact(null)}
          onToggleStar={toggleStar}
          onEmail={() => onCompose("sarah@realestate.com", detailContact.name)}
          onNotesChange={() => toast.success("Notes saved")}
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
