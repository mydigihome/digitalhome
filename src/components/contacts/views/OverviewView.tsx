import { useState } from "react";
import PriorityContactCard from "../cards/PriorityContactCard";
import ContactRow from "../cards/ContactRow";
import AddContactModal from "../modals/AddContactModal";
import ContactDetailPanel from "../panels/ContactDetailPanel";
import { useCreateContact } from "@/hooks/useContacts";
import { toast } from "sonner";

const MOCK_PRIORITY = [
  {
    id: "p1", name: "Sarah Johnson", role: "Real Estate Agent", location: "Denver, CO",
    isPriority: true, whyPriority: ["Linked to Buy Investment Property project", "Can save you $10k in realtor fees"],
    lastContactDays: 14, recentEmail: "Found 3 properties that match your ROI criteria...",
  },
  {
    id: "p2", name: "Mike Thompson", role: "Contractor", location: "Austin, TX",
    isPriority: true, whyPriority: ["Kitchen remodel quote expires in 48 hours", "Approval needed for electrical work"],
    lastContactDays: 3, recentEmail: "Just checking if you had a chance to look at the quartzite...",
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
];

const FILTERS = ["All", "Family", "Friends", "Professional"];

interface Props {
  onSwitchToEmails: () => void;
  onCompose: (to: string, name: string) => void;
}

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

export default function OverviewView({ onSwitchToEmails, onCompose }: Props) {
  const [filter, setFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailContact, setDetailContact] = useState<typeof MOCK_DETAIL | null>(null);
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

  return (
    <div className={detailContact ? "grid grid-cols-[1fr_420px] gap-6" : ""}>
      <div>
        {/* Priority + Emails grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
          {/* Left: Priority Contacts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-xl text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Priority Contacts
                </h2>
                <span className="text-[10px] text-[#767586] uppercase tracking-widest font-bold">THIS SEASON · Q1 2026</span>
              </div>
              <button className="text-[#4648d4] text-sm font-bold">View All</button>
            </div>
            <div className="space-y-4">
              {MOCK_PRIORITY.map((c) => (
                <PriorityContactCard
                  key={c.id}
                  contact={{ ...c, isPriority: priorityStars[c.id] ?? true }}
                  onToggleStar={toggleStar}
                  onEmail={() => onCompose(c.id === "p1" ? "sarah@realestate.com" : "mike@contractor.com", c.name)}
                  onSchedule={() => toast.info("Schedule feature coming soon")}
                  onEdit={() => setDetailContact(MOCK_DETAIL)}
                  onEmailClick={onSwitchToEmails}
                />
              ))}
            </div>
          </div>

          {/* Right: Priority Emails */}
          <div>
            <div className="mb-4">
              <h2 className="font-bold text-xl text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Priority Emails
              </h2>
              <span className="text-sm text-[#767586]">From your priority contacts</span>
            </div>
            <div className="space-y-3">
              {MOCK_EMAILS_PRIORITY.map((em) => (
                <div key={em.id} className="contacts-card-sm" style={{ boxShadow: "inset 4px 0 0 #4648d4, 0 12px 40px rgba(70,69,84,0.06)" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#e1e0ff] text-[#4648d4] font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {em.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-[#1a1c1f]">{em.sender}</span>
                        <span className="text-[10px] text-[#767586]">{em.time}</span>
                      </div>
                      <div className="font-bold text-sm text-[#1a1c1f]">{em.subject}</div>
                      <div className="text-xs text-[#767586] truncate">{em.snippet}</div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => onCompose(em.email, em.sender)}
                          className="bg-[#4648d4]/10 text-[#4648d4] rounded-full px-3 py-1 text-xs font-bold"
                        >
                          Reply
                        </button>
                        <button className="bg-[#f3f3f8] text-[#767586] rounded-full px-3 py-1 text-xs font-bold">
                          Archive
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          onNotesChange={(id, notes) => toast.success("Notes saved")}
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
