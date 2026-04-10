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
  ArrowUpDown, MessageSquare, Upload, FileSpreadsheet, UserPlus, Calendar,
  Gift
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

/* VCF Parser */
function parseVCF(text: string, userId: string) {
  const contacts: any[] = [];
  const cards = text.split("BEGIN:VCARD");
  cards.forEach(card => {
    if (!card.includes("END:VCARD")) return;
    const lines = card.split("\n");
    const contact: any = {};
    lines.forEach(line => {
      if (!contact.name) { const m = line.match(/^FN:(.+)/); if (m) contact.name = m[1].trim(); }
      if (!contact.email) { const m = line.match(/EMAIL.*:(.+)/); if (m) contact.email = m[1].trim(); }
      if (!contact.phone) { const m = line.match(/TEL.*:(.+)/); if (m) contact.phone = m[1].trim(); }
      if (!contact.company) { const m = line.match(/^ORG:(.+)/); if (m) contact.company = m[1].split(";")[0].trim(); }
    });
    if (contact.name) {
      contacts.push({ ...contact, relationship_type: "professional", user_id: userId });
    }
  });
  return contacts;
}

/* CSV Parser */
function parseCSV(text: string, userId: string) {
  const lines = text.split("\n");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
    const obj: any = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return {
      name: obj["name"] || (obj["first name"] ? `${obj["first name"] || ""} ${obj["last name"] || ""}`.trim() : obj["full name"] || ""),
      email: obj["email"] || obj["e-mail address"] || null,
      phone: obj["phone"] || obj["mobile phone"] || obj["phone number"] || null,
      company: obj["company"] || obj["organization"] || null,
      title: obj["title"] || obj["job title"] || null,
      relationship_type: "professional",
      user_id: userId,
    };
  }).filter(c => c.name);
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

  // Tag modal
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagModalContact, setTagModalContact] = useState<any>(null);

  // Import
  const [importDropdownOpen, setImportDropdownOpen] = useState(false);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importPreviewContacts, setImportPreviewContacts] = useState<any[]>([]);
  const [importSelected, setImportSelected] = useState<Set<number>>(new Set());
  const vcfInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Local contacts state for optimistic updates
  const [localContacts, setLocalContacts] = useState<any[]>([]);
  useEffect(() => { setLocalContacts(contacts as any[]); }, [contacts]);

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
  const filteredContacts = localContacts
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
    const emails = localContacts.filter(c => selectedIds.includes(c.id) && c.email).map(c => c.email);
    if (emails.length === 0) { toast.error("No email addresses found"); return; }
    window.open(`mailto:${emails.join(",")}`, "_blank");
  };

  const handleVCFImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const text = await file.text();
    const parsed = parseVCF(text, user.id);
    if (parsed.length === 0) { toast.error("No contacts found in VCF file"); return; }
    setImportPreviewContacts(parsed);
    setImportSelected(new Set(parsed.map((_, i) => i)));
    setImportPreviewOpen(true);
    e.target.value = "";
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const text = await file.text();
    const parsed = parseCSV(text, user.id);
    if (parsed.length === 0) { toast.error("No contacts found in CSV file"); return; }
    setImportPreviewContacts(parsed);
    setImportSelected(new Set(parsed.map((_, i) => i)));
    setImportPreviewOpen(true);
    e.target.value = "";
  };

  const handleImportConfirm = async () => {
    if (!user) return;
    const selected = importPreviewContacts.filter((_, i) => importSelected.has(i));
    if (selected.length === 0) return;
    const { error } = await supabase.from("contacts").insert(selected.map(c => ({ ...c, user_id: user.id })) as any);
    if (error) { toast.error("Import failed"); return; }
    toast.success(`${selected.length} contacts imported!`);
    setImportPreviewOpen(false);
    setImportPreviewContacts([]);
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
  };

  const isDark = document.documentElement.classList.contains("dark");

  const handleEditContact = (contact: Contact) => {
    setEditContact(contact);
    setAddContactOpen(true);
  };

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
        <EmailsTabContent contacts={localContacts} isDark={isDark} user={user} />
      ) : (
        <div>
          {/* TOOLBAR */}
          <div style={{
            display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", justifyContent: "space-between",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              background: isDark ? "#252528" : "white",
              border: `1.5px solid ${isDark ? "rgba(255,255,255,0.15)" : "#D1D5DB"}`,
              borderRadius: "8px", padding: "8px 14px", width: "280px",
            }}>
              <Search size={15} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <input
                type="text" placeholder="Search by name, email, or company..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: "none", outline: "none", fontSize: "14px",
                  color: isDark ? "#F2F2F2" : "#374151", background: "transparent", width: "100%",
                  fontFamily: "Inter, sans-serif",
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
                }}>{localContacts.length}</span>
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
              {/* Import dropdown */}
              <div style={{ position: "relative" }}>
                <button onClick={() => setImportDropdownOpen(!importDropdownOpen)} style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px",
                  background: isDark ? "#1C1C1E" : "white",
                  border: `1.5px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                  borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                  color: isDark ? "#F2F2F2" : "#374151", cursor: "pointer",
                }}>
                  <Upload size={14} /> Import <ChevronDown size={12} />
                </button>
                {importDropdownOpen && (
                  <div style={{
                    position: "absolute", top: "110%", right: 0,
                    background: isDark ? "#1C1C1E" : "white", borderRadius: "12px",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)", minWidth: "240px", zIndex: 100, overflow: "hidden",
                  }}>
                    <button onClick={() => { setImportDropdownOpen(false); vcfInputRef.current?.click(); }} style={{
                      width: "100%", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px",
                      border: "none", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`,
                      background: "transparent", cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: isDark ? "rgba(59,130,246,0.15)" : "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Phone size={16} color="#3B82F6" />
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", marginBottom: "2px" }}>From Phone / Device</p>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>Import a .vcf contacts file</p>
                      </div>
                    </button>
                    <button onClick={() => { setImportDropdownOpen(false); csvInputRef.current?.click(); }} style={{
                      width: "100%", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px",
                      border: "none", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}`,
                      background: "transparent", cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: isDark ? "rgba(16,185,129,0.15)" : "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <FileSpreadsheet size={16} color="#10B981" />
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", marginBottom: "2px" }}>From CSV / Spreadsheet</p>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>Google Contacts, Outlook, Excel</p>
                      </div>
                    </button>
                    <button onClick={() => { setImportDropdownOpen(false); setAddContactOpen(true); }} style={{
                      width: "100%", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "12px",
                      border: "none", background: "transparent", cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: isDark ? "rgba(123,94,167,0.15)" : "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <UserPlus size={16} color="#7B5EA7" />
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", marginBottom: "2px" }}>Add Manually</p>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>Enter contact details by hand</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              {/* Hidden file inputs */}
              <input ref={vcfInputRef} type="file" accept=".vcf" style={{ display: "none" }} onChange={handleVCFImport} />
              <input ref={csvInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSVImport} />
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
                // Follow-up indicator
                const daysSinceContact = contact.last_contacted_date
                  ? Math.floor((Date.now() - new Date(contact.last_contacted_date).getTime()) / 86400000)
                  : 999;
                const cadence = (contact as any).followup_cadence;
                const isOverdue = cadence && daysSinceContact > cadence;
                const isDueSoon = cadence && !isOverdue && (cadence - daysSinceContact) <= 7;

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
                        transition: "background 100ms, border-left 100ms",
                        borderLeft: "3px solid transparent",
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) e.currentTarget.style.background = isDark ? "#252528" : "#FAFAFA";
                        e.currentTarget.style.borderLeft = "3px solid #10B981";
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) e.currentTarget.style.background = isDark ? "#1C1C1E" : "white";
                        e.currentTarget.style.borderLeft = "3px solid transparent";
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox" checked={isSelected}
                        onChange={e => { e.stopPropagation(); toggleSelectContact(contact.id); }}
                        onClick={e => e.stopPropagation()}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#3B82F6" }}
                      />

                      {/* Name + Avatar + follow-up dot */}
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
                        <span style={{ fontSize: "15px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif" }}>
                          {contact.name}
                        </span>
                        {isOverdue && (
                          <span title="Follow-up overdue" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#EF4444", display: "inline-block", flexShrink: 0 }} />
                        )}
                        {isDueSoon && !isOverdue && (
                          <span title="Follow-up due soon" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#F59E0B", display: "inline-block", flexShrink: 0 }} />
                        )}
                      </div>

                      {/* Status badge */}
                      <div>
                        {status ? (
                          <span style={{
                            display: "inline-flex", padding: "3px 10px", borderRadius: "6px",
                            fontSize: "12px", fontWeight: 500,
                            ...(status === "Hot Lead" || status === "Hot"
                              ? { background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA" }
                              : status === "Warm" || status === "Partially Interested"
                              ? { background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }
                              : status === "Cold" || status === "Just Enquiry"
                              ? { background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }
                              : status === "Customer"
                              ? { background: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC" }
                              : { background: isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6", color: isDark ? "rgba(255,255,255,0.5)" : "#374151", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}` }
                            ),
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
                        onEdit={() => handleEditContact(contact)}
                        onDelete={() => handleDeleteContact(contact.id)}
                        onEmail={() => { setActiveTab("Emails"); }}
                        noteValues={noteValues}
                        setNoteValues={setNoteValues}
                        noteTimers={noteTimers}
                        user={user}
                        navigate={navigate}
                        setLocalContacts={setLocalContacts}
                        setTagModalContact={setTagModalContact}
                        setTagModalOpen={setTagModalOpen}
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

      {/* TAG MODAL */}
      <TagModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        contact={tagModalContact}
        isDark={isDark}
        user={user}
        setLocalContacts={setLocalContacts}
      />

      {/* IMPORT PREVIEW MODAL */}
      <ImportPreviewModal
        isOpen={importPreviewOpen}
        onClose={() => setImportPreviewOpen(false)}
        contacts={importPreviewContacts}
        selected={importSelected}
        setSelected={setImportSelected}
        onConfirm={handleImportConfirm}
        isDark={isDark}
      />
    </div>
  );
}

/* ===== EXPANDED CONTACT ROW — REDESIGNED ===== */
function ExpandedContactRow({ contact, isDark, onEdit, onDelete, onEmail, noteValues, setNoteValues, noteTimers, user, navigate, setLocalContacts, setTagModalContact, setTagModalOpen }: {
  contact: any; isDark: boolean;
  onEdit: () => void; onDelete: () => void; onEmail: () => void;
  noteValues: Record<string, string>;
  setNoteValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  noteTimers: React.MutableRefObject<Record<string, any>>;
  user: any; navigate: any;
  setLocalContacts: React.Dispatch<React.SetStateAction<any[]>>;
  setTagModalContact: (c: any) => void;
  setTagModalOpen: (v: boolean) => void;
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

  const daysSince = contact.last_contacted_date
    ? Math.floor((Date.now() - new Date(contact.last_contacted_date).getTime()) / 86400000)
    : 999;
  const strength = daysSince < 14
    ? { label: "Hot", color: "#065F46", bg: "#F0FDF4", border: "#BBF7D0" }
    : daysSince < 45
    ? { label: "Warm", color: "#92400E", bg: "#FFFBEB", border: "#FDE68A" }
    : { label: "Cold", color: "#374151", bg: "#F9FAFB", border: "#E5E7EB" };

  return (
    <div style={{ borderBottom: `2px solid ${isDark ? "rgba(123,94,167,0.15)" : "#EDE9FE"}`, borderLeft: "3px solid #7B5EA7", background: isDark ? "rgba(123,94,167,0.04)" : "#FDFCFF", position: "relative" }}>

      {/* ─── IDENTITY ROW ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 28px 16px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}` }}>
        {/* LEFT — Avatar + Identity */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: "#F5F3FF", border: `2px solid ${isDark ? "rgba(123,94,167,0.3)" : "#DDD6FE"}`,
            overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", fontWeight: 800, color: "#7B5EA7", flexShrink: 0,
          }}>
            {contact.photo_url ? (
              <img src={contact.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            ) : contact.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", marginBottom: "2px", fontFamily: "Inter, sans-serif", letterSpacing: "-0.2px" }}>
              {contact.name}
            </h3>
            {(contact.title || contact.company) && (
              <p style={{ fontSize: "13px", color: isDark ? "rgba(255,255,255,0.45)" : "#6B7280", marginBottom: "10px", fontFamily: "Inter, sans-serif" }}>
                {[contact.title, contact.company].filter(Boolean).join(" · ")}
              </p>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center" }}>
              {contact.email && (
                <a href={`mailto:${contact.email}`} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: isDark ? "#F2F2F2" : "#374151", textDecoration: "none", fontFamily: "Inter, sans-serif" }}>
                  <Mail size={12} color="#9CA3AF" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: isDark ? "#F2F2F2" : "#374151", textDecoration: "none", fontFamily: "Inter, sans-serif" }}>
                  <Phone size={12} color="#9CA3AF" /> {contact.phone}
                </a>
              )}
              {contact.location && (
                <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: isDark ? "#F2F2F2" : "#374151", fontFamily: "Inter, sans-serif" }}>
                  <MapPin size={12} color="#9CA3AF" /> {contact.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Actions + Relationship + Tags */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={e => { e.stopPropagation(); onEdit(); }}
              style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, borderRadius: "6px", color: isDark ? "rgba(255,255,255,0.4)" : "#6B7280", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontFamily: "Inter, sans-serif", transition: "all 150ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? "rgba(123,94,167,0.5)" : "#7B5EA7"; (e.currentTarget as HTMLButtonElement).style.color = isDark ? "#C4B5FD" : "#7B5EA7"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"; (e.currentTarget as HTMLButtonElement).style.color = isDark ? "rgba(255,255,255,0.4)" : "#6B7280"; }}>
              <Pencil size={11} /> Edit
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ padding: "5px 12px", background: "transparent", border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`, borderRadius: "6px", color: isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF", fontSize: "12px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontFamily: "Inter, sans-serif", transition: "all 150ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? "rgba(220,38,38,0.3)" : "#FECACA"; (e.currentTarget as HTMLButtonElement).style.color = isDark ? "#FCA5A5" : "#DC2626"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"; (e.currentTarget as HTMLButtonElement).style.color = isDark ? "rgba(255,255,255,0.4)" : "#9CA3AF"; }}>
              <Trash2 size={11} /> Delete
            </button>
          </div>
          <span style={{
            padding: "3px 10px",
            background: isDark ? (strength.label === "Hot" ? "rgba(16,185,129,0.1)" : strength.label === "Warm" ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)") : strength.bg,
            border: `1px solid ${isDark ? (strength.label === "Hot" ? "rgba(16,185,129,0.2)" : strength.label === "Warm" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.08)") : strength.border}`,
            borderRadius: "999px", fontSize: "12px", fontWeight: 600, color: strength.color, fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "4px",
          }}>
            {strength.label}
            {contact.last_contacted_date && (
              <span style={{ fontWeight: 400, opacity: 0.7, fontSize: "11px" }}>· {daysSince}d ago</span>
            )}
          </span>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "260px" }}>
            {(contact.tags || []).map((tag: string, i: number) => (
              <span key={i} style={{
                padding: "2px 8px",
                background: isDark ? "rgba(123,94,167,0.1)" : "#F5F3FF",
                border: `1px solid ${isDark ? "rgba(123,94,167,0.2)" : "#DDD6FE"}`,
                borderRadius: "999px", fontSize: "11px", fontWeight: 500,
                color: isDark ? "#C4B5FD" : "#7B5EA7", fontFamily: "Inter, sans-serif",
              }}>
                {tag}
              </span>
            ))}
            <button onClick={e => { e.stopPropagation(); setTagModalContact(contact); setTagModalOpen(true); }} style={{
              padding: "2px 8px", background: "transparent",
              border: `1px dashed ${isDark ? "rgba(255,255,255,0.15)" : "#D1D5DB"}`,
              borderRadius: "999px", fontSize: "11px", color: "#9CA3AF", cursor: "pointer", fontFamily: "Inter, sans-serif",
            }}>
              + Tag
            </button>
          </div>
        </div>
      </div>

      {/* ─── SECTIONS A + B ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1px 1fr", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}` }}>
        {/* A — QUICK ACTIONS */}
        <div style={{ padding: "20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: isDark ? "#F2F2F2" : "#111827", color: isDark ? "#111827" : "white", fontSize: "10px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "Inter, sans-serif" }}>A</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "Inter, sans-serif" }}>Quick Actions</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button onClick={e => { e.stopPropagation(); onEmail(); }} style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
              background: "#10B981", border: "none", borderRadius: "8px",
              fontSize: "13px", fontWeight: 600, color: "white", cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left", transition: "opacity 150ms",
            }} onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
              <Mail size={14} /> Send Email
            </button>
            <button onClick={e => { e.stopPropagation(); navigate("/projects"); }} style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
              background: isDark ? "rgba(123,94,167,0.15)" : "#F5F3FF", border: "none", borderRadius: "8px",
              fontSize: "13px", fontWeight: 600, color: isDark ? "#C4B5FD" : "#7B5EA7", cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left", transition: "opacity 150ms",
            }} onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
              <FolderPlus size={14} /> Create Project
            </button>
            <button onClick={e => { e.stopPropagation(); setShowTodoInput(!showTodoInput); }} style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px",
              background: isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4", border: "none", borderRadius: "8px",
              fontSize: "13px", fontWeight: 600, color: isDark ? "#6EE7B7" : "#065F46", cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left", transition: "opacity 150ms",
            }} onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
              <CheckSquare size={14} /> Add Task
            </button>
            {showTodoInput && (
              <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: "6px" }}>
                <input type="text" value={todoText} onChange={e => setTodoText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveTodo(); }}
                  placeholder="Type a to-do..." autoFocus
                  style={{
                    flex: 1, padding: "7px 10px", fontSize: "12px",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
                    borderRadius: "6px", outline: "none",
                    background: isDark ? "#252528" : "white", color: isDark ? "#F2F2F2" : "#374151",
                  }}
                />
                <button onClick={handleSaveTodo} disabled={!todoText.trim()} style={{
                  padding: "7px 12px", background: "#10B981", color: "white",
                  border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                }}>
                  {addTodo.isPending ? "..." : "Save"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Vertical divider */}
        <div style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6" }} />

        {/* B — FOLLOW-UP */}
        <div style={{ padding: "20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: isDark ? "#F2F2F2" : "#111827", color: isDark ? "#111827" : "white", fontSize: "10px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "Inter, sans-serif" }}>B</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "Inter, sans-serif" }}>Follow-up</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <span style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.45)" : "#6B7280", fontFamily: "Inter, sans-serif" }}>Last contacted</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", fontFamily: "Inter, sans-serif" }}>
              {contact.last_contacted_date ? new Date(contact.last_contacted_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Never"}
            </span>
          </div>
          <p style={{ fontSize: "12px", color: isDark ? "rgba(255,255,255,0.45)" : "#6B7280", marginBottom: "8px", fontFamily: "Inter, sans-serif" }}>Check in every</p>
          <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
            {[
              { label: "2 weeks", days: 14 },
              { label: "1 month", days: 30 },
              { label: "3 months", days: 90 },
              { label: "6 months", days: 180 },
            ].map(opt => (
              <button key={opt.days} onClick={async e => {
                e.stopPropagation();
                await supabase.from("contacts").update({ followup_cadence: opt.days } as any).eq("id", contact.id);
                setLocalContacts(prev => prev.map(c => c.id === contact.id ? { ...c, followup_cadence: opt.days } : c));
              }} style={{
                padding: "5px 12px", borderRadius: "999px", border: "1.5px solid",
                borderColor: contact.followup_cadence === opt.days ? "#10B981" : (isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"),
                background: contact.followup_cadence === opt.days ? (isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4") : "transparent",
                color: contact.followup_cadence === opt.days ? (isDark ? "#6EE7B7" : "#065F46") : (isDark ? "rgba(255,255,255,0.5)" : "#6B7280"),
                fontSize: "11px", fontWeight: contact.followup_cadence === opt.days ? 600 : 400, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 150ms",
              }}>
                {opt.label}
              </button>
            ))}
          </div>
          {/* Next due + overdue */}
          {contact.followup_cadence && contact.last_contacted_date && (() => {
            const next = new Date(contact.last_contacted_date);
            next.setDate(next.getDate() + contact.followup_cadence);
            const daysUntil = Math.floor((next.getTime() - Date.now()) / 86400000);
            const overdue = daysUntil < 0;
            return (
              <div style={{
                padding: "8px 12px", marginBottom: "10px",
                background: overdue ? (isDark ? "rgba(220,38,38,0.1)" : "#FEF2F2") : (isDark ? "rgba(16,185,129,0.1)" : "#F0FDF4"),
                border: `1px solid ${overdue ? (isDark ? "rgba(220,38,38,0.2)" : "#FECACA") : (isDark ? "rgba(16,185,129,0.2)" : "#BBF7D0")}`,
                borderRadius: "8px",
              }}>
                <p style={{ fontSize: "12px", fontWeight: 600, color: overdue ? "#DC2626" : "#065F46", fontFamily: "Inter, sans-serif", margin: 0 }}>
                  {overdue ? `Overdue · ${Math.abs(daysUntil)} days past due` : `Next due ${next.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${daysUntil}d away`}
                </p>
              </div>
            );
          })()}
          <button onClick={async e => {
            e.stopPropagation();
            const now = new Date().toISOString();
            await supabase.from("contacts").update({ last_contacted_date: now } as any).eq("id", contact.id);
            setLocalContacts(prev => prev.map(c => c.id === contact.id ? { ...c, last_contacted_date: now } : c));
            toast.success("Marked as contacted!");
          }} style={{
            width: "100%", padding: "8px",
            background: isDark ? "#252528" : "white",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
            borderRadius: "8px", fontSize: "12px", fontWeight: 500,
            color: isDark ? "#F2F2F2" : "#374151", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            fontFamily: "Inter, sans-serif", transition: "all 150ms",
          }}>
            <Check size={12} color="#10B981" /> Mark as Contacted Today
          </button>
        </div>
      </div>

      {/* ─── SECTION C — NOTES ─── */}
      <div style={{ padding: "20px 28px", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: isDark ? "#F2F2F2" : "#111827", color: isDark ? "#111827" : "white", fontSize: "10px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "Inter, sans-serif" }}>C</span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "Inter, sans-serif" }}>Notes</span>
          <span style={{ fontSize: "11px", color: "#D1D5DB", marginLeft: "auto", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "3px" }}>
            <Check size={10} /> Autosaves
          </span>
        </div>
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
          placeholder="What do you know about this person? Any context, conversations, or things to remember..."
          style={{
            width: "100%", minHeight: "80px", padding: "12px 14px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6"}`,
            borderRadius: "8px", fontSize: "14px",
            color: isDark ? "#F2F2F2" : "#374151", lineHeight: 1.7,
            resize: "vertical", outline: "none",
            background: isDark ? "#252528" : "#FAFAFA",
            boxSizing: "border-box", fontFamily: "Inter, sans-serif", transition: "all 150ms",
          }}
          onFocus={e => { e.target.style.borderColor = "#10B981"; e.target.style.background = isDark ? "#1C1C1E" : "white"; e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.06)"; }}
          onBlur={e => { e.target.style.borderColor = isDark ? "rgba(255,255,255,0.08)" : "#F3F4F6"; e.target.style.background = isDark ? "#252528" : "#FAFAFA"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* ─── SECTION D — HISTORY ─── */}
      <div style={{ padding: "20px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: isDark ? "#F2F2F2" : "#111827", color: isDark ? "#111827" : "white", fontSize: "10px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "Inter, sans-serif" }}>D</span>
          <span style={{ fontSize: "11px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.3)" : "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.8px", fontFamily: "Inter, sans-serif" }}>Interaction History</span>
        </div>
        {interactions.length > 0 ? (
          <div style={{ position: "relative", paddingLeft: "20px" }}>
            <div style={{ position: "absolute", left: "6px", top: "6px", bottom: "6px", width: "1px", background: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6" }} />
            {interactions.slice(0, 5).map((item: any, i: number) => (
              <div key={i} style={{ position: "relative", marginBottom: "14px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ position: "absolute", left: "-17px", top: "5px", width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", border: `2px solid ${isDark ? "#1C1C1E" : "white"}`, boxShadow: `0 0 0 2px ${isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6"}` }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", color: isDark ? "rgba(255,255,255,0.8)" : "#374151", lineHeight: 1.5, marginBottom: "2px", fontFamily: "Inter, sans-serif" }}>
                    {item.title || item.description || "Interaction"}
                  </p>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#9CA3AF", fontFamily: "Inter, sans-serif" }}>
                      {item.interaction_date ? new Date(item.interaction_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                    </span>
                    {item.interaction_type && (
                      <span style={{ fontSize: "10px", color: "#D1D5DB", fontFamily: "Inter, sans-serif" }}>· {item.interaction_type}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#9CA3AF", fontStyle: "italic", fontFamily: "Inter, sans-serif" }}>
            No interactions logged yet. Send an email or log one below.
          </p>
        )}
        <button onClick={e => e.stopPropagation()} style={{
          display: "flex", alignItems: "center", gap: "6px", marginTop: "12px",
          padding: "8px 14px", background: "transparent",
          border: `1px dashed ${isDark ? "rgba(255,255,255,0.1)" : "#D1D5DB"}`,
          borderRadius: "8px", fontSize: "12px", fontWeight: 500,
          color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280", cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "all 150ms",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#10B981"; e.currentTarget.style.color = "#10B981"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#D1D5DB"; e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.5)" : "#6B7280"; }}>
          <Plus size={12} /> Log an interaction
        </button>
      </div>
    </div>
  );
}

/* ===== TAG MODAL ===== */
function TagModal({ isOpen, onClose, contact, isDark, user, setLocalContacts }: {
  isOpen: boolean; onClose: () => void; contact: any; isDark: boolean; user: any;
  setLocalContacts: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  if (!isOpen || !contact) return null;

  const suggestedTags = ["Investor", "Mentor", "Collaborator", "Client", "Podcast Guest", "Friend", "Real Estate", "Creator"];

  const addTag = async (tag: string) => {
    const updated = [...(contact.tags || []), tag];
    await supabase.from("contacts").update({ tags: updated } as any).eq("id", contact.id);
    setLocalContacts(prev => prev.map(c => c.id === contact.id ? { ...c, tags: updated } : c));
    contact.tags = updated; // update ref for modal
  };

  const removeTag = async (tag: string) => {
    const updated = (contact.tags || []).filter((t: string) => t !== tag);
    await supabase.from("contacts").update({ tags: updated } as any).eq("id", contact.id);
    setLocalContacts(prev => prev.map(c => c.id === contact.id ? { ...c, tags: updated } : c));
    contact.tags = updated;
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: isDark ? "#1C1C1E" : "white", borderRadius: "16px", padding: "24px",
        maxWidth: "360px", width: "100%", boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", margin: 0 }}>
            Tags for {contact.name}
          </h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
            <X size={16} />
          </button>
        </div>
        {/* Current tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
          {(contact.tags || []).map((tag: string, i: number) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              padding: "4px 10px", background: isDark ? "rgba(123,94,167,0.15)" : "#F5F3FF",
              border: `1px solid ${isDark ? "rgba(123,94,167,0.3)" : "#DDD6FE"}`,
              borderRadius: "999px", fontSize: "12px", color: isDark ? "#C4B5FD" : "#7B5EA7", fontWeight: 500,
            }}>
              {tag}
              <button onClick={() => removeTag(tag)} style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "#9CA3AF", padding: "0 0 0 2px", lineHeight: 1,
              }}>
                <X size={11} />
              </button>
            </span>
          ))}
          {(!contact.tags || contact.tags.length === 0) && (
            <p style={{ fontSize: "12px", color: "#9CA3AF", fontStyle: "italic" }}>No tags yet</p>
          )}
        </div>
        {/* Add tag input */}
        <input
          placeholder="Type a tag and press Enter"
          onKeyDown={async e => {
            if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
              const newTag = (e.target as HTMLInputElement).value.trim();
              if (!(contact.tags || []).includes(newTag)) {
                await addTag(newTag);
              }
              (e.target as HTMLInputElement).value = "";
            }
          }}
          style={{
            width: "100%", padding: "10px 14px", borderRadius: "8px", fontSize: "13px",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
            background: isDark ? "#252528" : "#F9FAFB", color: isDark ? "#F2F2F2" : "#111827",
            outline: "none", boxSizing: "border-box", marginBottom: "12px",
          }}
        />
        {/* Suggested */}
        <p style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Suggestions</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {suggestedTags.filter(t => !(contact.tags || []).includes(t)).map(tag => (
            <button key={tag} onClick={() => addTag(tag)} style={{
              padding: "4px 12px", borderRadius: "999px", fontSize: "12px",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#E5E7EB"}`,
              background: "transparent", color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280",
              cursor: "pointer",
            }}>
              + {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ===== IMPORT PREVIEW MODAL ===== */
function ImportPreviewModal({ isOpen, onClose, contacts, selected, setSelected, onConfirm, isDark }: {
  isOpen: boolean; onClose: () => void; contacts: any[]; selected: Set<number>;
  setSelected: React.Dispatch<React.SetStateAction<Set<number>>>; onConfirm: () => void; isDark: boolean;
}) {
  if (!isOpen) return null;

  const toggleAll = () => {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map((_, i) => i)));
  };

  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "8vh",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: isDark ? "#1C1C1E" : "white", borderRadius: "20px", padding: "28px",
        maxWidth: "600px", width: "100%", maxHeight: "70vh", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: isDark ? "#F2F2F2" : "#111827", margin: 0 }}>
            Import {contacts.length} Contacts
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize: "13px", color: "#9CA3AF", marginBottom: "16px" }}>Review before importing</p>
        {/* Select all */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px", padding: "10px 0",
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#E5E7EB"}`, marginBottom: "4px",
        }}>
          <input type="checkbox" checked={selected.size === contacts.length} onChange={toggleAll}
            style={{ width: "16px", height: "16px", accentColor: "#10B981", cursor: "pointer" }}
          />
          <span style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#374151" }}>Select all</span>
        </div>
        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", marginBottom: "16px" }}>
          {contacts.map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 0",
              borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "#F3F4F6"}`,
            }}>
              <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)}
                style={{ width: "16px", height: "16px", accentColor: "#10B981", cursor: "pointer" }}
              />
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: isDark ? "#252528" : "#F3F4F6",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px", fontWeight: 700, color: isDark ? "rgba(255,255,255,0.5)" : "#6B7280", flexShrink: 0,
              }}>
                {c.name?.charAt(0).toUpperCase() || "?"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: isDark ? "#F2F2F2" : "#111827", margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {[c.email, c.company].filter(Boolean).join(" · ") || "No details"}
                </p>
              </div>
            </div>
          ))}
        </div>
        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "10px 20px", background: isDark ? "#252528" : "#F3F4F6", border: "none",
            borderRadius: "10px", fontSize: "14px", fontWeight: 600,
            color: isDark ? "rgba(255,255,255,0.6)" : "#374151", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} disabled={selected.size === 0} style={{
            padding: "10px 20px", background: "#10B981", border: "none", borderRadius: "10px",
            fontSize: "14px", fontWeight: 600, color: "white", cursor: "pointer",
            opacity: selected.size > 0 ? 1 : 0.5,
          }}>
            Import Selected ({selected.size})
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
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>Status</p>
            <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
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
  contacts: any[]; isDark: boolean; user: any;
}) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactSearch, setContactSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [emailTone, setEmailTone] = useState("cold");
  const [emailSubject, setEmailSubject] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (fmt: string) => {
    const el = draftRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.substring(start, end);
    if (!selected) return;
    const wrapped = fmt === "bold"
      ? "**" + selected + "**"
      : fmt === "italic"
      ? "_" + selected + "_"
      : "<u>" + selected + "</u>";
    const newVal =
      el.value.substring(0, start) +
      wrapped +
      el.value.substring(end);
    setGeneratedEmail(newVal);
    setTimeout(() => {
      el.selectionStart = start;
      el.selectionEnd = start + wrapped.length;
      el.focus();
    }, 0);
  };
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
                    <div key={c.id} onClick={() => { setSelectedContact(c as any); setShowDropdown(false); setContactSearch(""); }}
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
          <button onClick={generateDraft} disabled={!selectedContact || generating} style={{
            width: "100%", height: "44px", background: selectedContact ? "#7B5EA7" : (isDark ? "#333" : "#D1D5DB"),
            color: "white", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
            cursor: selectedContact ? "pointer" : "not-allowed", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px", opacity: generating ? 0.7 : 1,
          }}>
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? "Generating..." : "Generate Draft"}
          </button>
          {generatedEmail && (
            <div style={{
              background: isDark ? "#252528" : "#F9FAFB", border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}`,
              borderRadius: "10px", padding: "14px",
            }}>
              <p style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>AI Draft</p>
              <div style={{
                display: "flex",
                flexDirection: "row",
                gap: "6px",
                marginBottom: "8px",
                paddingBottom: "8px",
                borderBottom: "1px solid #E5E7EB"
              }}>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat("bold"); }} style={{ height: 32, width: 32, background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 6, fontFamily: "Inter, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>B</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat("italic"); }} style={{ height: 32, width: 32, background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 6, fontFamily: "Inter, sans-serif", fontSize: 13, fontStyle: "italic", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>I</button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyFormat("underline"); }} style={{ height: 32, width: 32, background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: 6, fontFamily: "Inter, sans-serif", fontSize: 13, textDecoration: "underline", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>U</button>
              </div>
              <textarea
                ref={draftRef}
                value={generatedEmail}
                onChange={e => setGeneratedEmail(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: 180,
                  padding: 12,
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  lineHeight: 1.6,
                  resize: "vertical",
                  boxSizing: "border-box" as const,
                  outline: "none",
                  display: "block",
                  background: isDark ? "#252528" : "white",
                  color: isDark ? "#F2F2F2" : "#374151",
                  margin: "0 0 14px",
                }}
                onFocus={e => { e.target.style.borderColor = "#7B5EA7"; }}
                onBlur={e => { e.target.style.borderColor = "#E5E7EB"; }}
              />
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
