import { useState, useEffect, useRef } from "react";
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
  Linkedin, Users, ChevronDown, X
} from "lucide-react";
import LinkedInSelectionPanel from "./panels/LinkedInSelectionPanel";
import EmailView from "./views/EmailView";
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

export default function ContactsPage() {
  const { user, profile } = useAuth();
  const { data: contacts = [], isLoading } = useContacts();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { data: gmailConnection } = useGmailConnection();
  const { connect: connectGmail, connecting } = useConnectGmail();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("Overview");
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<"name" | "last_contacted_date">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // AI Email panel state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [emailTone, setEmailTone] = useState("cold");
  const [emailSubject, setEmailSubject] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [emailGenerating, setEmailGenerating] = useState(false);

  // Add contact modal
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);

  // Compose modal
  const [compose, setCompose] = useState<{ open: boolean; to: string; name: string; subject?: string; threadId?: string; isReply?: boolean }>({ open: false, to: "", name: "" });

  // LinkedIn panel
  const [linkedInPanel, setLinkedInPanel] = useState<{ open: boolean; connections: LinkedInConnection[] }>({ open: false, connections: [] });

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    if (user) {
      const url = user.user_metadata?.avatar_url;
      if (url) setAvatarUrl(url);
    }
  }, [user]);

  // Emailed count
  const [emailedCount, setEmailedCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { count } = await supabase
        .from("contact_interactions")
        .select("id", { count: "exact", head: true })
        .eq("interaction_type", "email");
      if (count != null) setEmailedCount(count);
    })();
  }, [user]);

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

  const handleLinkedInImport = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please sign in to connect LinkedIn"); return; }
      const redirectUri = `${window.location.origin}/relationships`;
      const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID || "86vrea7sthla29";
      const scope = "openid profile email";
      const state = crypto.randomUUID();
      sessionStorage.setItem("linkedin_oauth_state", state);
      window.location.href = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
    } catch { toast.error("Failed to start LinkedIn connection"); }
  };

  // Filtering & sorting
  const filteredContacts = contacts
    .filter(c => {
      if (filter !== "All") {
        const cat = getCategoryFromType(c.relationship_type);
        if (filter === "Digi Home") return cat === "Digi Home" || c.imported_from === "digihome";
        return cat === filter;
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

  const handleSort = (field: "name" | "last_contacted_date") => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    deleteContact.mutate(id);
    if (expandedId === id) setExpandedId(null);
    toast.success("Contact deleted");
  };

  // AI Email Generation
  const generateEmail = async () => {
    if (!selectedContact) return;
    setEmailGenerating(true);
    const toneMap: Record<string, string> = {
      cold: "cold outreach — professional, concise, value-focused",
      warm: "warm and friendly — familiar tone, personal touch",
      checkin: "casual check-in — brief, genuine, no agenda",
      followup: "follow up — references previous conversation, next steps",
    };
    const prompt = `Write a short professional email from ${profile?.full_name || "me"} to ${selectedContact.name}.
Contact details:
- Name: ${selectedContact.name}
- Title: ${selectedContact.title || selectedContact.job_title || "unknown"}
- Company: ${selectedContact.company || "unknown"}
- Category: ${getCategoryFromType(selectedContact.relationship_type)}
- Last interaction: ${selectedContact.last_contacted_date ? formatRelativeDate(selectedContact.last_contacted_date) : "never"}

Email tone: ${toneMap[emailTone] || toneMap.cold}
${emailSubject ? `Topic: ${emailSubject}` : ""}

Write ONLY the email body. No subject line. No preamble. Max 4 sentences. Sound human, not AI-generated. End with a single clear call to action.`;

    try {
      const { data, error } = await supabase.functions.invoke("generate-email-draft", { body: { prompt } });
      if (error) throw error;
      setGeneratedEmail(data.plan);
    } catch {
      toast.error("Could not generate email. Try again.");
    } finally {
      setEmailGenerating(false);
    }
  };

  const openCompose = (to: string, name: string, subject?: string, threadId?: string, isReply?: boolean) => {
    setCompose({ open: true, to, name, subject, threadId, isReply });
  };

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div style={{ padding: "0" }}>
      {/* PAGE HEADER */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%", overflow: "hidden",
            border: `2px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, flexShrink: 0,
            background: isDark ? "#252528" : "#F5F3FF",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", fontWeight: 700, color: isDark ? "#E9D5FF" : "#7B5EA7",
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              profile?.full_name?.charAt(0)?.toUpperCase() || "?"
            )}
          </div>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", marginBottom: "2px", margin: 0 }}>
              {profile?.full_name || "Your Network"}
            </h1>
            <p style={{ fontSize: "13px", color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", fontStyle: "italic", margin: 0 }}>
              Your network is your net worth.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "12px" }}>
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "24px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", lineHeight: 1, margin: 0 }}>{contacts.length}</p>
              <p style={{ fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Total Contacts</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "24px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", lineHeight: 1, margin: 0 }}>{emailedCount}</p>
              <p style={{ fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Emails Sent</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleLinkedInImport} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
              background: "#0A66C2", color: "white", border: "none", borderRadius: "8px",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
            }}>
              <Linkedin size={14} /> Import from LinkedIn
            </button>
            <button onClick={() => gmailConnection ? null : connectGmail()} style={{
              display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
              background: isDark ? "#1C1C1E" : "white", border: `1.5px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
              borderRadius: "8px", fontSize: "13px", fontWeight: 600,
              color: gmailConnection ? "#10B981" : (isDark ? "#F2F2F2" : "#374151"), cursor: "pointer",
            }}>
              <Mail size={14} /> {gmailConnection ? "Gmail Connected" : connecting ? "Connecting..." : "Connect Gmail"}
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{
        display: "flex", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
        marginBottom: "20px", gap: 0,
      }}>
        {["Overview", "Emails", "Contacts"].map(tab => (
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
        <EmailView onReply={(to, name, subject, threadId) => openCompose(to, name, subject, threadId, true)} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>
          {/* LEFT: Contact list */}
          <div>
            {/* TOOLBAR */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px", flexWrap: "wrap",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px", flex: 1, maxWidth: "320px",
                background: isDark ? "#252528" : "#F9FAFB", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                borderRadius: "8px", padding: "8px 14px",
              }}>
                <Search size={14} color="#9CA3AF" />
                <input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    border: "none", background: "transparent", outline: "none", fontSize: "14px",
                    color: isDark ? "#F2F2F2" : "#374151", width: "100%",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {["All", "Family", "Friends", "Professional", "Digi Home"].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: "6px 14px", borderRadius: "999px",
                    border: `1.5px solid ${filter === f ? "#10B981" : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB")}`,
                    background: filter === f ? "#10B981" : "transparent",
                    color: filter === f ? "white" : (isDark ? "rgba(255,255,255,0.7)" : "#374151"),
                    fontSize: "13px", fontWeight: filter === f ? 600 : 400, cursor: "pointer",
                  }}>
                    {f}
                  </button>
                ))}
              </div>
              <button onClick={() => { setEditContact(null); setAddContactOpen(true); }} style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px",
                background: "#10B981", color: "white", border: "none", borderRadius: "8px",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}>
                <Plus size={14} /> Add Contact
              </button>
            </div>

            {isLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                <Loader2 size={24} className="animate-spin" style={{ color: "#9CA3AF" }} />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <Users size={40} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "15px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", marginBottom: "4px" }}>No contacts found</p>
                <p style={{ fontSize: "13px", color: "#6B7280" }}>Add contacts or adjust your filters.</p>
              </div>
            ) : (
              <div>
                {/* TABLE HEADER */}
                <div style={{
                  display: "grid", gridTemplateColumns: "40px 2fr 1.5fr 1fr 1fr 1fr",
                  padding: "10px 16px", background: isDark ? "#252528" : "#F9FAFB",
                  borderRadius: "8px 8px 0 0", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
                  borderBottom: "none", fontSize: "12px", fontWeight: 600,
                  color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280",
                  textTransform: "uppercase", letterSpacing: "0.5px",
                }}>
                  <span></span>
                  <span style={{ cursor: "pointer" }} onClick={() => handleSort("name")}>
                    Contact {sortField === "name" ? (sortDir === "asc" ? "↓" : "↑") : ""}
                  </span>
                  <span>Email</span>
                  <span>Category</span>
                  <span>Company</span>
                  <span style={{ cursor: "pointer" }} onClick={() => handleSort("last_contacted_date")}>
                    Last Contact {sortField === "last_contacted_date" ? (sortDir === "asc" ? "↓" : "↑") : ""}
                  </span>
                </div>

                {/* ROWS */}
                {filteredContacts.map(contact => {
                  const category = getCategoryFromType(contact.relationship_type);
                  const isExpanded = expandedId === contact.id;
                  return (
                    <div key={contact.id}>
                      {/* COLLAPSED ROW */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                        style={{
                          display: "grid", gridTemplateColumns: "40px 2fr 1.5fr 1fr 1fr 1fr",
                          padding: "14px 16px",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
                          borderTop: "none", alignItems: "center", cursor: "pointer",
                          background: isExpanded ? (isDark ? "#252528" : "#F9FAFB") : (isDark ? "#1C1C1E" : "white"),
                          transition: "background 150ms",
                        }}
                        onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = isDark ? "#252528" : "#F9FAFB"; }}
                        onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = isDark ? "#1C1C1E" : "white"; }}
                      >
                        <div style={{
                          width: "10px", height: "10px", borderRadius: "50%",
                          background: contact.last_contacted_date ? "#10B981" : "#D1D5DB", margin: "0 auto",
                        }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "40px", height: "40px", borderRadius: "50%",
                            background: isDark ? "rgba(123,94,167,0.2)" : "#F5F3FF",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "15px", fontWeight: 700, color: "#7B5EA7", flexShrink: 0, overflow: "hidden",
                          }}>
                            {contact.photo_url ? (
                              <img src={contact.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                            ) : contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: "14px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", margin: 0 }}>
                              {contact.name}
                            </p>
                            <p style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", margin: 0 }}>
                              {contact.title || contact.job_title || category}
                            </p>
                          </div>
                        </div>
                        <span style={{ fontSize: "13px", color: isDark ? "rgba(255,255,255,0.6)" : "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {contact.email || "—"}
                        </span>
                        <span style={{
                          display: "inline-flex", padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, width: "fit-content",
                          background: isDark
                            ? (category === "Professional" ? "rgba(29,78,216,0.15)" : category === "Friends" ? "rgba(16,185,129,0.15)" : category === "Family" ? "rgba(245,158,11,0.15)" : "rgba(123,94,167,0.15)")
                            : (category === "Professional" ? "#EFF6FF" : category === "Friends" ? "#F0FDF4" : category === "Family" ? "#FFF7ED" : "#F5F3FF"),
                          color: category === "Professional" ? "#1D4ED8" : category === "Friends" ? "#065F46" : category === "Family" ? "#92400E" : "#7B5EA7",
                        }}>
                          {category}
                        </span>
                        <span style={{ fontSize: "13px", color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280" }}>
                          {contact.company || "—"}
                        </span>
                        <span style={{ fontSize: "13px", color: "#9CA3AF" }}>
                          {contact.last_contacted_date ? formatRelativeDate(contact.last_contacted_date) : "Never"}
                        </span>
                      </div>

                      {/* EXPANDED DROPDOWN */}
                      {isExpanded && (
                        <ExpandedContactRow
                          contact={contact}
                          category={category}
                          isDark={isDark}
                          onEdit={() => { setEditContact(contact); setAddContactOpen(true); }}
                          onDelete={() => handleDeleteContact(contact.id)}
                          onEmail={() => { setSelectedContact(contact); setEmailTone("cold"); setGeneratedEmail(""); }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: AI Email Panel */}
          <div style={{ position: "sticky", top: "20px" }}>
            <div style={{
              background: isDark ? "#1C1C1E" : "white", borderRadius: "16px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`, overflow: "hidden",
            }}>
              <div style={{
                padding: "16px 20px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`,
                display: "flex", alignItems: "center", gap: "8px",
              }}>
                <Sparkles size={16} color="#7B5EA7" />
                <span style={{ fontSize: "14px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827" }}>AI Email Composer</span>
              </div>
              <div style={{ padding: "16px 20px" }}>
                {/* Recipient */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "6px" }}>TO</label>
                  <div style={{
                    padding: "8px 12px", background: isDark ? "#252528" : "#F9FAFB", borderRadius: "8px",
                    fontSize: "13px", color: selectedContact ? (isDark ? "#F2F2F2" : "#111827") : "#9CA3AF",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                  }}>
                    {selectedContact?.name || "Select a contact →"}
                    {selectedContact?.email && <span style={{ color: "#9CA3AF", marginLeft: "6px" }}>{selectedContact.email}</span>}
                  </div>
                </div>

                {/* Tone */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "6px" }}>TONE</label>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {[{ id: "cold", label: "Cold" }, { id: "warm", label: "Warm" }, { id: "checkin", label: "Check In" }, { id: "followup", label: "Follow Up" }].map(tone => (
                      <button key={tone.id} onClick={() => setEmailTone(tone.id)} style={{
                        padding: "5px 10px", borderRadius: "999px",
                        border: `1.5px solid ${emailTone === tone.id ? "#7B5EA7" : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB")}`,
                        background: emailTone === tone.id ? (isDark ? "rgba(123,94,167,0.2)" : "#F5F3FF") : "transparent",
                        color: emailTone === tone.id ? "#7B5EA7" : (isDark ? "rgba(255,255,255,0.6)" : "#374151"),
                        fontSize: "12px", fontWeight: emailTone === tone.id ? 600 : 400, cursor: "pointer",
                      }}>
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject hint */}
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", display: "block", marginBottom: "6px" }}>ABOUT (optional)</label>
                  <input
                    placeholder="e.g. Investment property..."
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                      borderRadius: "8px", fontSize: "13px", outline: "none", boxSizing: "border-box",
                      background: isDark ? "#252528" : "white", color: isDark ? "#F2F2F2" : "#111827",
                    }}
                  />
                </div>

                {/* Generate */}
                <button onClick={generateEmail} disabled={!selectedContact || emailGenerating} style={{
                  width: "100%", padding: "10px",
                  background: !selectedContact ? (isDark ? "#252528" : "#F3F4F6") : "#7B5EA7",
                  color: !selectedContact ? "#9CA3AF" : "white", border: "none", borderRadius: "8px",
                  fontSize: "13px", fontWeight: 600, cursor: !selectedContact ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "14px",
                }}>
                  {emailGenerating ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate Draft</>}
                </button>

                {/* Generated email */}
                {generatedEmail && (
                  <div>
                    <div style={{
                      background: isDark ? "#252528" : "#F9FAFB",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
                      borderRadius: "10px", padding: "14px", marginBottom: "12px",
                    }}>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>AI DRAFT</p>
                      <p style={{ fontSize: "13px", color: isDark ? "#F2F2F2" : "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>{generatedEmail}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button onClick={() => {
                        if (!selectedContact?.email) { toast.error("No email address"); return; }
                        const mailto = `mailto:${selectedContact.email}?subject=Checking In&body=${encodeURIComponent(generatedEmail)}`;
                        window.open(mailto);
                        supabase.from("contact_interactions").insert({
                          user_id: user!.id, contact_id: selectedContact.id,
                          interaction_type: "email", title: "Email sent",
                          description: `${emailTone} email sent`,
                        } as any);
                        supabase.from("contacts").update({ last_contacted_date: new Date().toISOString() } as any).eq("id", selectedContact.id);
                      }} style={{
                        width: "100%", padding: "11px", background: isDark ? "#F2F2F2" : "#111827",
                        color: isDark ? "#111827" : "white", border: "none", borderRadius: "8px",
                        fontSize: "13px", fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      }}>
                        <Mail size={14} /> Open in Email App
                      </button>
                      <button onClick={() => {
                        supabase.from("email_drafts").insert({
                          user_id: user!.id, contact_id: selectedContact?.id, content: generatedEmail, tone: emailTone,
                        } as any);
                        toast.success("Saved to drafts!");
                      }} style={{
                        width: "100%", padding: "11px", background: "transparent",
                        border: `1.5px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, borderRadius: "8px",
                        fontSize: "13px", fontWeight: 500, color: isDark ? "rgba(255,255,255,0.7)" : "#374151",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      }}>
                        <BookOpen size={14} /> Save to Drafts
                      </button>
                      <button onClick={generateEmail} style={{
                        width: "100%", padding: "8px", background: "transparent", border: "none",
                        fontSize: "12px", color: "#7B5EA7", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                      }}>
                        <RotateCw size={12} /> Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
function ExpandedContactRow({ contact, category, isDark, onEdit, onDelete, onEmail }: {
  contact: Contact; category: string; isDark: boolean;
  onEdit: () => void; onDelete: () => void; onEmail: () => void;
}) {
  const { data: interactions = [] } = useContactInteractions(contact.id);

  return (
    <div style={{
      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`,
      borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.03)" : "#F3F4F6"}`,
      background: isDark ? "#111112" : "#FAFAFA", padding: "20px 24px",
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px",
    }}>
      {/* COLUMN 1: Last interactions */}
      <div>
        <h4 style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", margin: "0 0 12px" }}>Last Interactions</h4>
        {interactions.length > 0 ? interactions.slice(0, 3).map((interaction, i) => (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "10px", alignItems: "flex-start" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", flexShrink: 0, marginTop: "6px" }} />
            <div>
              <p style={{ fontSize: "13px", color: isDark ? "#F2F2F2" : "#374151", lineHeight: 1.4, margin: 0 }}>{interaction.title || interaction.description || "Interaction"}</p>
              <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px", margin: "2px 0 0" }}>{formatRelativeDate(interaction.interaction_date)}</p>
            </div>
          </div>
        )) : (
          <p style={{ fontSize: "13px", color: "#9CA3AF", fontStyle: "italic", margin: 0 }}>No interactions yet</p>
        )}
      </div>

      {/* COLUMN 2: Quick actions */}
      <div>
        <h4 style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", margin: "0 0 12px" }}>Quick Actions</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <button onClick={(e) => { e.stopPropagation(); }} style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
            background: isDark ? "#1C1C1E" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
            borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: isDark ? "#F2F2F2" : "#374151",
            cursor: "pointer", textAlign: "left", width: "100%",
          }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isDark ? "rgba(123,94,167,0.2)" : "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FolderPlus size={14} color="#7B5EA7" />
            </div>
            Create Project
          </button>
          <button onClick={(e) => { e.stopPropagation(); }} style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
            background: isDark ? "#1C1C1E" : "white", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
            borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: isDark ? "#F2F2F2" : "#374151",
            cursor: "pointer", textAlign: "left", width: "100%",
          }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckSquare size={14} color="#10B981" />
            </div>
            Create Task
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEmail(); }} style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
            background: "#10B981", border: "none", borderRadius: "8px", fontSize: "13px",
            fontWeight: 600, color: "white", cursor: "pointer", textAlign: "left", width: "100%",
          }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mail size={14} color="white" />
            </div>
            Send Email
          </button>
        </div>
      </div>

      {/* COLUMN 3: Details */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Details</h4>
          <div style={{ display: "flex", gap: "4px" }}>
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} style={{ padding: "4px", border: "none", background: "transparent", cursor: "pointer", borderRadius: "4px", color: "#9CA3AF" }}>
              <Pencil size={13} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ padding: "4px", border: "none", background: "transparent", cursor: "pointer", borderRadius: "4px", color: "#9CA3AF" }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        {[
          { icon: Mail, label: contact.email || "—" },
          { icon: Phone, label: contact.phone || "—" },
          { icon: Briefcase, label: contact.company || "—" },
          { icon: MapPin, label: (contact as any).location || "—" },
        ].map(({ icon: Icon, label }, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Icon size={13} color="#9CA3AF" />
            <span style={{ fontSize: "13px", color: isDark ? "rgba(255,255,255,0.7)" : "#374151" }}>{label}</span>
          </div>
        ))}
        {contact.notes && (
          <div style={{
            marginTop: "10px", padding: "10px",
            background: isDark ? "#1C1C1E" : "#F9FAFB", borderRadius: "8px",
            fontSize: "12px", color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280", lineHeight: 1.5,
          }}>
            {contact.notes}
          </div>
        )}
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

  useEffect(() => {
    if (editContact) {
      setName(editContact.name || "");
      setEmail(editContact.email || "");
      setPhone(editContact.phone || "");
      setCompany(editContact.company || "");
      setTitle(editContact.title || editContact.job_title || "");
      setNotes(editContact.notes || "");
      setCategory(getCategoryFromType(editContact.relationship_type));
    } else {
      setName(""); setEmail(""); setPhone(""); setCompany(""); setTitle(""); setNotes(""); setCategory("Professional");
    }
  }, [editContact, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name, email: email || null, phone: phone || null, company: company || null,
      title: title || null, notes: notes || null,
      relationship_type: category.toLowerCase().replace(" ", ""),
    });
  };

  const categories = ["Professional", "Friends", "Family", "Digi Home", "Other"];
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
