import { useState, useEffect, useRef, useCallback } from "react";
import { useAddQuickTodo, useQuickTodos } from "@/hooks/useQuickTodos";
import { AnimatePresence, motion } from "framer-motion";
import { useContacts, useCreateContact, useUpdateContact, useDeleteContact, useContactInteractions, useCreateInteraction, type Contact } from "@/hooks/useContacts";
import { useGmailConnection, useConnectGmail } from "@/hooks/useGmail";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Search, Plus, Mail, Phone, MapPin, Briefcase, Pencil, Trash2,
  Sparkles, Loader2, RotateCw, BookOpen, FolderPlus, CheckSquare,
  Linkedin, Users, ChevronDown, ChevronUp, X, Check, Filter,
  ArrowUpDown, MessageSquare
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LinkedInSelectionPanel from "./panels/LinkedInSelectionPanel";
import ComposeModal from "./modals/ComposeModal";
import "../../styles/contacts-tab.css";

interface LinkedInConnection {
  name: string;
  email: string | null;
  job_title: string | null;
  company: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
}

function formatRelativeDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

function getCategoryFromType(type: string | null): string {
  if (!type) return "Professional";
  if (type === "digihome") return "Digi Home";
  const map: Record<string, string> = {
    family: "Family", friends: "Friends", professional: "Professional",
    mentor: "Professional", digihome: "Digi Home",
  };
  return map[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1);
}

function getCompanyColor(company: string): string {
  const colors = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1",
  ];
  let hash = 0;
  for (let i = 0; i < company.length; i++) {
    hash = company.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function ContactsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { data: contacts = [], isLoading } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { data: gmailConnection } = useGmailConnection();
  const { connect: connectGmail, connecting } = useConnectGmail();
  const queryClient = useQueryClient();
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});
  const noteTimers = useRef<Record<string, any>>({});

  const [activeTab, setActiveTab] = useState("Overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"name" | "last_contacted_date">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState("All");

  // Add contact modal
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  // Compose modal
  const [compose, setCompose] = useState<{ open: boolean; to: string; name: string; subject?: string; threadId?: string; isReply?: boolean }>({ open: false, to: "", name: "" });

  // LinkedIn panel
  const [linkedInPanel, setLinkedInPanel] = useState<{ open: boolean; connections: LinkedInConnection[] }>({ open: false, connections: [] });

  // LinkedIn OAuth callback
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const savedState = sessionStorage.getItem("linkedin_oauth_state");
    if (code && state && savedState === state) {
      sessionStorage.removeItem("linkedin_oauth_state");
      window.history.replaceState({}, "", url.pathname);
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) { toast.error("Please sign in to connect LinkedIn"); return; }
          const redirectUri = `${window.location.origin}/relationships`;
          const { data, error } = await supabase.functions.invoke("linkedin-import", {
            body: { code, redirect_uri: redirectUri },
          });
          if (error) { toast.error("LinkedIn import failed"); return; }
          if (data?.success && data?.connections) {
            setLinkedInPanel({ open: true, connections: data.connections });
          } else {
            toast.error(data?.error || "LinkedIn import failed");
          }
        } catch {
          toast.error("Failed to complete LinkedIn import");
        }
      })();
    }
  }, [queryClient]);

  // Filtering & sorting
  const filteredContacts = contacts
    .filter(c => {
      if (filterValue !== "All") {
        const cat = getCategoryFromType(c.relationship_type);
        if (filterValue === "Digi Home") return cat === "Digi Home" || c.imported_from === "digihome";
        return cat === filterValue;
      }
      return true;
    })
    .filter(c => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortField === "name") {
        return sortDir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      const aDate = a.last_contacted_date ? new Date(a.last_contacted_date).getTime() : 0;
      const bDate = b.last_contacted_date ? new Date(b.last_contacted_date).getTime() : 0;
      return sortDir === "asc" ? aDate - bDate : bDate - aDate;
    });

  const toggleSort = (field: "name" | "last_contacted_date") => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const toggleSelectContact = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    deleteContact.mutate(id);
    if (expandedId === id) setExpandedId(null);
    setSelectedIds(prev => prev.filter(x => x !== id));
    toast.success("Contact deleted");
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteContact.mutate(id));
    setSelectedIds([]);
    setExpandedId(null);
    toast.success("Contacts removed");
  };

  const handleBulkEmail = () => {
    const emails = contacts.filter(c => selectedIds.includes(c.id) && c.email).map(c => c.email);
    if (emails.length === 0) { toast.error("No email addresses found"); return; }
    window.open(`mailto:${emails.join(",")}`, "_blank");
  };

  const openCompose = (to: string, name: string, subject?: string, threadId?: string, isReply?: boolean) => {
    setCompose({ open: true, to, name, subject, threadId, isReply });
  };

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div style={{ padding: "0" }}>
      {/* TABS */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
        marginBottom: "20px", gap: 0,
      }}>
        {["Overview", "Emails"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "10px 20px", border: "none", background: "transparent", fontSize: "14px",
            fontWeight: activeTab === tab ? 600 : 400,
            color: activeTab === tab ? (isDark ? "#F2F2F2" : "#111827") : (isDark ? "rgba(255,255,255,0.4)" : "#6B7280"),
            borderBottom: activeTab === tab ? "2px solid #10B981" : "2px solid transparent",
            cursor: "pointer", marginBottom: "-1px",
          }}>
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === "Emails" ? (
        <EmailsTabContent contacts={contacts} isDark={isDark} user={user} />
      ) : (
        <div>
          {/* TOOLBAR */}
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", justifyContent: "space-between",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: isDark ? "#252528" : "white",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
              borderRadius: "8px", padding: "8px 14px", width: "280px",
            }}>
              <Search size={15} color="#9CA3AF" />
              <input
                type="text" placeholder="Search contacts..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: "none", outline: "none", fontSize: "14px",
                  color: isDark ? "#F2F2F2" : "#374151", background: "transparent", width: "100%",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {/* All people pill */}
              <div style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px",
                background: isDark ? "rgba(59,130,246,0.1)" : "#EFF6FF",
                border: `1px solid ${isDark ? "rgba(59,130,246,0.3)" : "#BFDBFE"}`,
                borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                color: isDark ? "#93C5FD" : "#1D4ED8",
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "#3B82F6" }} />
                All people
                <span style={{
                  background: "#3B82F6", color: "white", borderRadius: "999px",
                  padding: "1px 7px", fontSize: "11px",
                }}>{contacts.length}</span>
              </div>
              {/* Filter */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setFilterOpen(!filterOpen)} style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                  borderRadius: "8px", background: isDark ? "#1C1C1E" : "white",
                  fontSize: "13px", color: isDark ? "#F2F2F2" : "#374151", cursor: "pointer",
                }}>
                  <Filter size={14} /> Filter
                </button>
                {filterOpen && (
                  <div style={{
                    position: "absolute", top: "100%", right: 0, marginTop: "4px", zIndex: 30,
                    background: isDark ? "#252528" : "white", borderRadius: "8px",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: "160px",
                  }}>
                    {["All", "Professional", "Friends", "Family", "Digi Home"].map(f => (
                      <div key={f} onClick={() => { setFilterValue(f); setFilterOpen(false); }}
                        style={{
                          padding: "8px 14px", cursor: "pointer", fontSize: "13px",
                          color: filterValue === f ? "#10B981" : (isDark ? "#F2F2F2" : "#374151"),
                          fontWeight: filterValue === f ? 600 : 400,
                          background: filterValue === f ? (isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4") : "transparent",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = isDark ? "#1C1C1E" : "#F9FAFB")}
                        onMouseLeave={e => (e.currentTarget.style.background = filterValue === f ? (isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4") : "transparent")}
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Sort */}
              <button onClick={() => toggleSort("name")} style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                borderRadius: "8px", background: isDark ? "#1C1C1E" : "white",
                fontSize: "13px", color: isDark ? "#F2F2F2" : "#374151", cursor: "pointer",
              }}>
                <ArrowUpDown size={14} /> Sort
              </button>
              {/* Add contact */}
              <button onClick={() => { setEditContact(null); setAddContactOpen(true); }} style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
                background: "#10B981", color: "white", border: "none", borderRadius: "8px",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}>
                <Plus size={14} /> Add Contact
              </button>
            </div>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "#9CA3AF" }} />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ padding: "80px 20px", textAlign: "center" }}>
              <Users size={48} color="#D1D5DB" style={{ margin: "0 auto 16px" }} />
              <p style={{ fontSize: "16px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", marginBottom: "6px" }}>No contacts yet</p>
              <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "20px" }}>Add your first contact to get started</p>
              <button onClick={() => { setEditContact(null); setAddContactOpen(true); }} style={{
                padding: "10px 24px", background: "#10B981", color: "white", border: "none",
                borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer",
              }}>
                + Add Contact
              </button>
            </div>
          ) : (
            <div style={{
              background: isDark ? "#1C1C1E" : "white", borderRadius: "12px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, overflow: "hidden",
            }}>
              {/* TABLE HEADER */}
              <div style={{
                display: "grid", gridTemplateColumns: "40px 2fr 1.5fr 2fr 1.5fr 1fr 1.5fr",
                padding: "12px 20px", borderBottom: `2px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
                fontSize: "13px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827",
                alignItems: "center", background: isDark ? "#252528" : "white",
              }}>
                <input
                  type="checkbox"
                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#3B82F6" }}
                  onChange={e => {
                    if (e.target.checked) setSelectedIds(filteredContacts.map(c => c.id));
                    else setSelectedIds([]);
                  }}
                  checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0}
                />
                <div style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}
                  onClick={() => toggleSort("name")}>
                  Name
                  <ChevronUp size={14} color="#9CA3AF" style={{
                    transition: "transform 200ms",
                    transform: sortField === "name" && sortDir === "desc" ? "rotate(180deg)" : "rotate(0deg)",
                  }} />
                </div>
                <span>Status</span>
                <span>Email</span>
                <span>Phone</span>
                <span>Notes</span>
                <span>Company</span>
              </div>

              {/* ROWS */}
              {filteredContacts.map(contact => {
                const isExpanded = expandedId === contact.id;
                const isSelected = selectedIds.includes(contact.id);
                const status = (contact as any).status || null;
                return (
                  <div key={contact.id}>
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                      style={{
                        display: "grid", gridTemplateColumns: "40px 2fr 1.5fr 2fr 1.5fr 1fr 1.5fr",
                        padding: "14px 20px",
                        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6"}`,
                        alignItems: "center", cursor: "pointer",
                        background: isSelected
                          ? (isDark ? "rgba(59,130,246,0.1)" : "#EFF6FF")
                          : (isDark ? "#1C1C1E" : "white"),
                        transition: "background 100ms",
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = isDark ? "#252528" : "#FAFAFA"; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isDark ? "#1C1C1E" : "white"; }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox" checked={isSelected}
                        onChange={e => { e.stopPropagation(); toggleSelectContact(contact.id); }}
                        onClick={e => e.stopPropagation()}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#3B82F6" }}
                      />

                      {/* Name + Avatar */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                          background: isDark ? "#252528" : "#F3F4F6",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "13px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280",
                        }}>
                          {contact.photo_url ? (
                            <img src={contact.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          ) : contact.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontSize: "14px", fontWeight: 500, color: isDark ? "#F2F2F2" : "#111827" }}>
                          {contact.name}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div>
                        {status ? (
                          <span style={{
                            display: "inline-flex", padding: "3px 10px", borderRadius: "6px",
                            fontSize: "12px", fontWeight: 500,
                            background: isDark
                              ? (status === "Hot Lead" ? "rgba(234,179,8,0.15)" : status === "Customer" ? "rgba(16,185,129,0.15)" : status === "Partially Interested" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)")
                              : (status === "Hot Lead" ? "#FEF9C3" : status === "Customer" ? "#DCFCE7" : status === "Partially Interested" ? "#FEF3C7" : "#F3F4F6"),
                            color: status === "Hot Lead" ? "#854D0E" : status === "Customer" ? "#166534" : status === "Partially Interested" ? "#92400E" : (isDark ? "rgba(255,255,255,0.5)" : "#374151"),
                            border: `1px solid ${
                              isDark
                                ? (status === "Hot Lead" ? "rgba(234,179,8,0.3)" : status === "Customer" ? "rgba(16,185,129,0.3)" : status === "Partially Interested" ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)")
                                : (status === "Hot Lead" ? "#FDE047" : status === "Customer" ? "#86EFAC" : status === "Partially Interested" ? "#FCD34D" : "#E5E7EB")
                            }`,
                          }}>
                            {status}
                          </span>
                        ) : (
                          <span style={{ fontSize: "13px", color: isDark ? "rgba(255,255,255,0.2)" : "#D1D5DB" }}>—</span>
                        )}
                      </div>

                      {/* Email */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{
                          fontSize: "13px", color: isDark ? "rgba(255,255,255,0.6)" : "#374151",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {contact.email || "—"}
                        </span>
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()}
                            style={{ display: "flex", flexShrink: 0, color: "#9CA3AF" }}>
                            <Mail size={13} />
                          </a>
                        )}
                      </div>

                      {/* Phone */}
                      <span style={{ fontSize: "13px", color: isDark ? "rgba(255,255,255,0.5)" : "#374151" }}>
                        {contact.phone || "—"}
                      </span>

                      {/* Notes count */}
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#9CA3AF", fontSize: "13px" }}>
                        {contact.notes ? (
                          <><MessageSquare size={13} /><span>1</span></>
                        ) : <span>—</span>}
                      </div>

                      {/* Company */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {contact.company ? (
                          <>
                            <div style={{
                              width: "24px", height: "24px", borderRadius: "6px",
                              background: getCompanyColor(contact.company),
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "11px", fontWeight: 700, color: "white", flexShrink: 0,
                            }}>
                              {contact.company.charAt(0).toUpperCase()}
                            </div>
                            <span style={{
                              fontSize: "13px", color: isDark ? "rgba(255,255,255,0.6)" : "#374151",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {contact.company}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: "13px", color: isDark ? "rgba(255,255,255,0.2)" : "#D1D5DB" }}>—</span>
                        )}
                      </div>
                    </div>

                    {/* EXPANDED ACCORDION */}
                    {isExpanded && (
                      <ExpandedContactRow
                        contact={contact}
                        isDark={isDark}
                        onEdit={() => { setEditContact(contact); setAddContactOpen(true); }}
                        onDelete={() => handleDeleteContact(contact.id)}
                        onEmail={() => { setActiveTab("Emails"); }}
                        noteValues={noteValues}
                        setNoteValues={setNoteValues}
                        noteTimers={noteTimers}
                        user={user}
                        navigate={navigate}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* BULK ACTION BAR */}
          {selectedIds.length > 0 && (
            <div style={{
              position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
              background: "#111827", color: "white", borderRadius: "12px", padding: "12px 20px",
              display: "flex", alignItems: "center", gap: "16px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.25)", zIndex: 200,
            }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>{selectedIds.length} selected</span>
              <button onClick={handleBulkEmail} style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px",
                background: "#10B981", color: "white", border: "none", borderRadius: "8px",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}>
                <Mail size={13} /> Email selected
              </button>
              <button onClick={() => { if (window.confirm(`Remove ${selectedIds.length} contacts?`)) handleBulkDelete(); }} style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px",
                background: "rgba(220,38,38,0.2)", color: "#FCA5A5",
                border: "1px solid rgba(220,38,38,0.3)", borderRadius: "8px",
                fontSize: "13px", cursor: "pointer",
              }}>
                <Trash2 size={13} /> Remove from list
              </button>
              <button onClick={() => setSelectedIds([])} style={{
                background: "transparent", border: "none", color: "rgba(255,255,255,0.5)",
                cursor: "pointer", padding: "4px",
              }}>
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ADD/EDIT CONTACT MODAL */}
      <AddContactModalInline
        isOpen={addContactOpen}
        onClose={() => { setAddContactOpen(false); setEditContact(null); }}
        editContact={editContact}
        isDark={isDark}
        onSave={(data) => {
          if (editContact) {
            updateContact.mutate({ id: editContact.id, ...data });
            toast.success("Contact updated");
          } else {
            createContact.mutate(data);
            toast.success(`${data.name} added`);
          }
          setAddContactOpen(false);
          setEditContact(null);
        }}
      />

      <ComposeModal
        isOpen={compose.open}
        onClose={() => setCompose({ ...compose, open: false })}
        to={compose.to} toName={compose.name} subject={compose.subject}
        threadId={compose.threadId} isReply={compose.isReply}
      />

      <LinkedInSelectionPanel
        isOpen={linkedInPanel.open}
        onClose={() => setLinkedInPanel({ open: false, connections: [] })}
        connections={linkedInPanel.connections}
      />
    </div>
  );
}

/* EXPANDED CONTACT ROW */
function ExpandedContactRow({ contact, isDark, onEdit, onDelete, onEmail, noteValues, setNoteValues, noteTimers, user, navigate }: {
  contact: Contact; isDark: boolean;
  onEdit: () => void; onDelete: () => void; onEmail: () => void;
  noteValues: Record<string, string>;
  setNoteValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  noteTimers: React.MutableRefObject<Record<string, any>>;
  user: any; navigate: any;
}) {
  const { data: interactions = [] } = useContactInteractions(contact.id);
  const { data: quickTodos = [] } = useQuickTodos();
  const addTodo = useAddQuickTodo();
  const [showTodoInput, setShowTodoInput] = useState(false);
  const [todoText, setTodoText] = useState("");

  const handleSaveTodo = () => {
    if (!todoText.trim()) return;
    addTodo.mutate({ text: todoText.trim(), order: quickTodos.length }, {
      onSuccess: () => {
        toast.success("To-do added to dashboard!");
        setTodoText("");
        setShowTodoInput(false);
      },
    });
  };

  return (
    <div style={{ borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`, background: isDark ? "#111112" : "#F9FAFB" }}>
      {/* BANNER */}
      <div style={{ height: "72px", background: "linear-gradient(135deg, #7B5EA7, #10B981)", position: "relative" }}>
        <div style={{
          position: "absolute", bottom: "-20px", left: "20px", width: "48px", height: "48px",
          borderRadius: "50%", border: `3px solid ${isDark ? "#1C1C1E" : "white"}`,
          background: isDark ? "rgba(123,94,167,0.3)" : "#F5F3FF",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px", fontWeight: 800, color: "#7B5EA7", overflow: "hidden",
        }}>
          {contact.photo_url
            ? <img src={contact.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            : contact.name.charAt(0).toUpperCase()
          }
        </div>
        <div style={{ position: "absolute", top: "10px", right: "14px", display: "flex", gap: "6px" }}>
          <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{
            padding: "5px 10px", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "6px", color: "white", fontSize: "11px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            <Pencil size={10} /> Edit
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{
            padding: "5px 10px", background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)",
            borderRadius: "6px", color: "#FCA5A5", fontSize: "11px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "4px",
          }}>
            <Trash2 size={10} /> Delete
          </button>
        </div>
      </div>

      {/* CONTENT - 4 columns */}
      <div style={{ padding: "32px 20px 20px", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr", gap: "20px" }}>
        {/* COL 1 — Identity */}
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", margin: "0 0 2px" }}>{contact.name}</h3>
          <p style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", margin: "0 0 12px" }}>
            {[contact.title, contact.company].filter(Boolean).join(" · ")}
          </p>
          {[
            { Icon: Mail, value: contact.email, href: contact.email ? `mailto:${contact.email}` : undefined },
            { Icon: Phone, value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : undefined },
            { Icon: MapPin, value: (contact as any).location },
            { Icon: Briefcase, value: contact.company },
          ].filter(i => i.value).map(({ Icon, value, href }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "7px" }}>
              <Icon size={12} color="#9CA3AF" />
              {href ? (
                <a href={href} onClick={e => e.stopPropagation()} style={{ fontSize: "13px", color: "#10B981", textDecoration: "none" }}>{value}</a>
              ) : (
                <span style={{ fontSize: "13px", color: isDark ? "rgba(255,255,255,0.7)" : "#374151" }}>{value}</span>
              )}
            </div>
          ))}
        </div>

        {/* COL 2 — Quick Actions */}
        <div>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>Quick Actions</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button onClick={e => { e.stopPropagation(); onEmail(); }} style={{
              display: "flex", alignItems: "center", gap: "7px", padding: "8px 12px",
              background: "#10B981", color: "white", border: "none", borderRadius: "7px",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}>
              <Mail size={12} /> Send Email
            </button>
            <button onClick={e => { e.stopPropagation(); navigate("/projects"); }} style={{
              display: "flex", alignItems: "center", gap: "7px", padding: "8px 12px",
              background: isDark ? "#1C1C1E" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
              borderRadius: "7px", fontSize: "12px", color: isDark ? "#F2F2F2" : "#374151", cursor: "pointer",
            }}>
              <FolderPlus size={12} color="#7B5EA7" /> Create Project
            </button>
            <button onClick={e => e.stopPropagation()} style={{
              display: "flex", alignItems: "center", gap: "7px", padding: "8px 12px",
              background: isDark ? "#1C1C1E" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
              borderRadius: "7px", fontSize: "12px", color: isDark ? "#F2F2F2" : "#374151", cursor: "pointer",
            }}>
              <CheckSquare size={12} color="#10B981" /> Create Task
            </button>
          </div>
          <div style={{ marginTop: "12px" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 4px" }}>Last Contacted</p>
            <p style={{
              fontSize: "12px", margin: 0,
              color: contact.last_contacted_date ? (isDark ? "#F2F2F2" : "#111827") : "#9CA3AF",
              fontStyle: contact.last_contacted_date ? "normal" : "italic",
            }}>
              {contact.last_contacted_date
                ? new Date(contact.last_contacted_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Never"}
            </p>
          </div>
        </div>

        {/* COL 3 — Notes */}
        <div>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>Notes</p>
          <textarea
            value={noteValues[contact.id] ?? contact.notes ?? ""}
            onChange={e => {
              const val = e.target.value;
              setNoteValues(prev => ({ ...prev, [contact.id]: val }));
              clearTimeout(noteTimers.current[contact.id]);
              noteTimers.current[contact.id] = setTimeout(async () => {
                await supabase.from("contacts").update({ notes: val } as any).eq("id", contact.id);
              }, 1000);
            }}
            onClick={e => e.stopPropagation()}
            placeholder="Notes... autosaves."
            style={{
              width: "100%", minHeight: "110px", padding: "8px 10px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
              borderRadius: "7px", fontSize: "12px", color: isDark ? "#F2F2F2" : "#374151",
              lineHeight: 1.6, resize: "vertical", outline: "none",
              background: isDark ? "#252528" : "white", boxSizing: "border-box", fontFamily: "inherit",
            }}
            onFocus={e => { e.target.style.borderColor = "#10B981"; }}
            onBlur={e => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"; }}
          />
          <p style={{ fontSize: "10px", color: "#9CA3AF", margin: "3px 0 0" }}>✓ Autosaves</p>
        </div>

        {/* COL 4 — Interactions */}
        <div>
          <p style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>Interactions</p>
          {interactions.length > 0
            ? interactions.slice(0, 3).map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#10B981", flexShrink: 0, marginTop: "5px" }} />
                <div>
                  <p style={{ fontSize: "12px", color: isDark ? "#F2F2F2" : "#374151", lineHeight: 1.4, margin: 0 }}>{item.title || item.description || "Interaction"}</p>
                  <p style={{ fontSize: "10px", color: "#9CA3AF", margin: "2px 0 0" }}>{formatRelativeDate(item.interaction_date)}</p>
                </div>
              </div>
            ))
            : <p style={{ fontSize: "12px", color: "#9CA3AF", fontStyle: "italic", margin: 0 }}>No interactions yet.</p>
          }
          <button onClick={e => e.stopPropagation()} style={{
            display: "flex", alignItems: "center", gap: "5px", marginTop: "6px",
            padding: "6px 10px", background: "transparent",
            border: `1px dashed ${isDark ? "rgba(255,255,255,0.15)" : "#D1D5DB"}`,
            borderRadius: "6px", fontSize: "11px", color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280",
            cursor: "pointer", width: "100%", justifyContent: "center",
          }}>
            <Plus size={11} /> Log interaction
          </button>
        </div>
      </div>
    </div>
  );
}

/* ADD/EDIT CONTACT MODAL */
function AddContactModalInline({ isOpen, onClose, editContact, isDark, onSave }: {
  isOpen: boolean; onClose: () => void; editContact: Contact | null; isDark: boolean;
  onSave: (data: Partial<Contact>) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("Professional");
  const [status, setStatus] = useState("Just Enquiry");

  useEffect(() => {
    if (editContact) {
      setName(editContact.name || "");
      setEmail(editContact.email || "");
      setPhone(editContact.phone || "");
      setCompany(editContact.company || "");
      setTitle(editContact.title || editContact.job_title || "");
      setNotes(editContact.notes || "");
      setCategory(getCategoryFromType(editContact.relationship_type));
      setStatus((editContact as any).status || "Just Enquiry");
    } else {
      setName(""); setEmail(""); setPhone(""); setCompany(""); setTitle(""); setNotes("");
      setCategory("Professional"); setStatus("Just Enquiry");
    }
  }, [editContact, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name, email: email || null, phone: phone || null, company: company || null,
      title: title || null, notes: notes || null,
      relationship_type: category.toLowerCase().replace(" ", ""),
    } as any);
  };

  const categories = ["Professional", "Friends", "Family", "Digi Home", "Other"];
  const statuses = ["Just Enquiry", "Partially Interested", "Hot Lead", "Customer"];
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
    borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box",
    background: isDark ? "#252528" : "#F9FAFB", color: isDark ? "#F2F2F2" : "#111827",
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "10vh",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: isDark ? "#1C1C1E" : "white", borderRadius: "20px", padding: "32px",
        maxWidth: "480px", width: "100%", boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", margin: 0 }}>
            {editContact ? "Edit Contact" : "Add Contact"}
          </h2>
          <button onClick={onClose} style={{ padding: "6px", background: isDark ? "#252528" : "#F3F4F6", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            <X size={16} color="#9CA3AF" />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name *" style={inputStyle} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" style={inputStyle} />
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company" style={inputStyle} />
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Job Title" style={inputStyle} />
          </div>
          {/* Category */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>Category</p>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {categories.map(c => (
                <button key={c} onClick={() => setCategory(c)} style={{
                  padding: "6px 14px", borderRadius: "999px", fontSize: "13px",
                  border: `1.5px solid ${category === c ? "#10B981" : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB")}`,
                  background: category === c ? "#10B981" : "transparent",
                  color: category === c ? "white" : (isDark ? "rgba(255,255,255,0.6)" : "#374151"),
                  fontWeight: category === c ? 600 : 400, cursor: "pointer",
                }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          {/* Status */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>Status</p>
            <select
              value={status} onChange={e => setStatus(e.target.value)}
              style={{
                ...inputStyle, cursor: "pointer",
              }}
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }} />
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
          <button onClick={onClose} style={{
            padding: "10px 20px", background: isDark ? "#252528" : "#F3F4F6", border: "none",
            borderRadius: "10px", fontSize: "14px", fontWeight: 600,
            color: isDark ? "rgba(255,255,255,0.6)" : "#374151", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim()} style={{
            padding: "10px 20px", background: "#10B981", border: "none", borderRadius: "10px",
            fontSize: "14px", fontWeight: 600, color: "white", cursor: "pointer", opacity: name.trim() ? 1 : 0.5,
          }}>{editContact ? "Save Changes" : "Add Contact"}</button>
        </div>
      </div>
    </div>
  );
}

/* EMAILS TAB CONTENT */
function EmailsTabContent({ contacts, isDark, user }: {
  contacts: Contact[]; isDark: boolean; user: any;
}) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [emailTone, setEmailTone] = useState("cold");
  const [emailSubject, setEmailSubject] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setHistoryLoading(true);
      const { data } = await supabase
        .from("contact_emails")
        .select("*, contact:contacts(name, photo_url)")
        .order("sent_at", { ascending: false })
        .limit(20);
      setEmailHistory(data || []);
      setHistoryLoading(false);
    })();
  }, [user]);

  const filteredContacts = contacts.filter(c => {
    if (!contactSearch) return true;
    const q = contactSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
  });

  const generateDraft = async () => {
    if (!selectedContact) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-trading-plan", {
        body: {
          prompt: `Write a short ${emailTone} email to ${selectedContact.name} who is ${selectedContact.title || "a professional"} at ${selectedContact.company || "their company"}. ${emailSubject ? "Topic: " + emailSubject : ""} Max 3 sentences. Sound human not AI. End with one clear call to action. Write ONLY the email body.`,
        },
      });
      if (error) throw error;
      setGeneratedEmail(data.plan || data.content || "");
    } catch {
      toast.error("Could not generate email. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const saveToDrafts = async () => {
    if (!user || !selectedContact || !generatedEmail) return;
    await supabase.from("email_drafts").insert({
      user_id: user.id, contact_id: selectedContact.id,
      content: generatedEmail, tone: emailTone,
    } as any);
    toast.success("Saved to drafts");
  };

  const openInEmail = () => {
    if (!selectedContact?.email || !generatedEmail) return;
    const subject = emailSubject || `Reaching out to ${selectedContact.name}`;
    window.open(`mailto:${selectedContact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(generatedEmail)}`, "_blank");
  };

  const tones = [
    { key: "cold", label: "Cold" }, { key: "warm", label: "Warm" },
    { key: "checkin", label: "Check In" }, { key: "followup", label: "Follow Up" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px" }}>
      {/* LEFT — AI Email Composer */}
      <div style={{
        background: isDark ? "#1C1C1E" : "white", borderRadius: "12px",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, padding: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <Sparkles size={18} color="#7B5EA7" />
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", margin: 0 }}>AI Email Composer</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* TO */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>To</p>
            <div style={{ position: "relative" }} ref={dropdownRef}>
              {selectedContact ? (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: "8px",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                  background: isDark ? "#252528" : "#F9FAFB",
                }}>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827" }}>{selectedContact.name}</span>
                    {selectedContact.email && <span style={{ fontSize: "12px", color: "#9CA3AF", marginLeft: "8px" }}>{selectedContact.email}</span>}
                  </div>
                  <button onClick={() => { setSelectedContact(null); setGeneratedEmail(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "2px" }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <input placeholder="Search contacts..." value={contactSearch}
                  onChange={e => { setContactSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "8px", fontSize: "14px",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                    background: isDark ? "#252528" : "#F9FAFB", color: isDark ? "#F2F2F2" : "#111827",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              )}
              {showDropdown && !selectedContact && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                  background: isDark ? "#252528" : "white", borderRadius: "8px",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: "200px", overflowY: "auto", marginTop: "4px",
                }}>
                  {filteredContacts.length === 0 ? (
                    <p style={{ padding: "12px", fontSize: "13px", color: "#9CA3AF", margin: 0 }}>No contacts found</p>
                  ) : filteredContacts.slice(0, 8).map(c => (
                    <div key={c.id} onClick={() => { setSelectedContact(c); setShowDropdown(false); setContactSearch(""); }}
                      style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F9FAFB"}` }}
                      onMouseEnter={e => (e.currentTarget.style.background = isDark ? "#1C1C1E" : "#F9FAFB")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isDark ? "rgba(123,94,167,0.2)" : "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#7B5EA7", flexShrink: 0 }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", margin: 0 }}>{c.name}</p>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>{c.email || "No email"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* TONE */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>Tone</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {tones.map(t => (
                <button key={t.key} onClick={() => setEmailTone(t.key)} style={{
                  padding: "6px 14px", borderRadius: "999px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                  background: emailTone === t.key ? "#7B5EA7" : "transparent",
                  color: emailTone === t.key ? "white" : (isDark ? "rgba(255,255,255,0.6)" : "#374151"),
                  border: emailTone === t.key ? "1px solid #7B5EA7" : `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                }}>{t.label}</button>
              ))}
            </div>
          </div>
          {/* ABOUT */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>About (optional)</p>
            <input placeholder="e.g. Investment property..." value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "8px", fontSize: "14px",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                background: isDark ? "#252528" : "#F9FAFB", color: isDark ? "#F2F2F2" : "#111827",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          {/* Generate */}
          <button onClick={generateDraft} disabled={!selectedContact || generating} style={{
            width: "100%", height: "44px", background: selectedContact ? "#7B5EA7" : (isDark ? "#333" : "#D1D5DB"),
            color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
            cursor: selectedContact ? "pointer" : "not-allowed", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px", opacity: generating ? 0.7 : 1,
          }}>
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? "Generating..." : "Generate Draft"}
          </button>
          {/* Draft */}
          {generatedEmail && (
            <div style={{
              background: isDark ? "#252528" : "#F9FAFB", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
              borderRadius: "10px", padding: "14px",
            }}>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>AI Draft</p>
              <p style={{ fontSize: "13px", color: isDark ? "#F2F2F2" : "#374151", lineHeight: 1.6, margin: "0 0 14px", whiteSpace: "pre-wrap" }}>{generatedEmail}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button onClick={openInEmail} style={{ width: "100%", padding: "10px", background: isDark ? "#F2F2F2" : "#111827", color: isDark ? "#111827" : "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Open in Email App</button>
                <button onClick={saveToDrafts} style={{ width: "100%", padding: "10px", background: "transparent", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: isDark ? "#F2F2F2" : "#374151", cursor: "pointer" }}>Save to Drafts</button>
                <button onClick={() => { setGeneratedEmail(""); generateDraft(); }} style={{ background: "none", border: "none", fontSize: "12px", color: "#7B5EA7", cursor: "pointer", padding: "4px 0", fontWeight: 500 }}>↻ Regenerate</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — Email History */}
      <div style={{
        background: isDark ? "#1C1C1E" : "white", borderRadius: "12px",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, padding: "20px",
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", margin: "0 0 16px" }}>Sent Emails</h3>
        {historyLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
            <Loader2 size={20} className="animate-spin" style={{ color: "#9CA3AF" }} />
          </div>
        ) : emailHistory.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Mail size={36} color="#D1D5DB" style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: "14px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", margin: "0 0 4px" }}>No emails sent yet</p>
            <p style={{ fontSize: "13px", color: "#9CA3AF", margin: 0 }}>Compose your first one ←</p>
          </div>
        ) : (
          <div>
            {emailHistory.map((email: any) => (
              <div key={email.id} style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "12px 0",
                borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F9FAFB"}`,
              }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: isDark ? "rgba(123,94,167,0.2)" : "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#7B5EA7", flexShrink: 0 }}>
                  {email.contact?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", margin: 0 }}>{email.contact?.name || "Unknown"}</p>
                </div>
                {email.tone && (
                  <span style={{ padding: "2px 8px", borderRadius: "999px", fontSize: "10px", fontWeight: 600, background: isDark ? "rgba(123,94,167,0.15)" : "#F5F3FF", color: "#7B5EA7" }}>{email.tone}</span>
                )}
                <span style={{ fontSize: "11px", color: "#9CA3AF", flexShrink: 0 }}>{email.sent_at ? formatRelativeDate(email.sent_at) : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
