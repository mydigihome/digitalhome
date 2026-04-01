import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Check } from "lucide-react";
import { toast } from "sonner";

interface LinkedContact {
  id: string;
  contact_id: string;
  relevance_reason: string | null;
  contact: {
    id: string;
    name: string;
    photo_url: string | null;
    relationship_type: string | null;
    job_title: string | null;
    last_contacted_date: string | null;
  };
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  professional: { bg: "#e1e0ff", text: "#4648d4" },
  family: { bg: "#ffe4e6", text: "#be123c" },
  friends: { bg: "#dcfce7", text: "#16a34a" },
};

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function getTypeColor(type: string | null) {
  return TYPE_COLORS[type || ""] || TYPE_COLORS.professional;
}

function daysAgo(date: string | null): number {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

export default function ProjectContactAvatars({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showPopover, setShowPopover] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [hoveredAvatar, setHoveredAvatar] = useState<string | null>(null);

  const { data: links = [] } = useQuery({
    queryKey: ["contact_project_links", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_project_links")
        .select("id, contact_id, relevance_reason, contacts:contact_id(id, name, photo_url, relationship_type, job_title, last_contacted_date)")
        .eq("project_id", projectId) as any;
      return (data || []) as LinkedContact[];
    },
    enabled: !!user,
  });

  const { data: allContacts = [] } = useQuery({
    queryKey: ["contacts_for_link", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("id, name, photo_url, relationship_type, job_title").eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user && showPopover,
  });

  const linkedIds = new Set(links.map(l => l.contact_id));
  const filtered = allContacts.filter(c => !searchQ || c.name.toLowerCase().includes(searchQ.toLowerCase()));

  const handleLink = async (contactId: string) => {
    await supabase.from("contact_project_links").insert({ contact_id: contactId, project_id: projectId, relevance_reason: "user_linked" } as any);
    qc.invalidateQueries({ queryKey: ["contact_project_links", projectId] });
    const c = allContacts.find(x => x.id === contactId);
    toast.success(`${c?.name || "Contact"} linked to this project`);
    setShowPopover(false);
  };

  const handleAvatarClick = (contactId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/relationships", { state: { openContactId: contactId, openModal: true } });
  };

  const displayLinks = links.slice(0, 3);
  const extraCount = Math.max(links.length - 3, 0);

  return (
    <div style={{ position: "absolute", bottom: "12px", right: "12px", zIndex: 6 }} className="flex items-center" onClick={e => e.stopPropagation()}>
      {displayLinks.map((link, i) => {
        const c = link.contact as any;
        if (!c) return null;
        const colors = getTypeColor(c.relationship_type);
        const days = daysAgo(c.last_contacted_date);
        const isOverdue = days > 14;

        return (
          <div key={link.id} className="relative" style={{ marginLeft: i > 0 ? "-8px" : 0, zIndex: 3 - i }}>
            <div
              onMouseEnter={() => setHoveredAvatar(link.id)}
              onMouseLeave={() => setHoveredAvatar(null)}
              onClick={e => handleAvatarClick(c.id, e)}
              className="cursor-pointer"
              style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid white", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, fontSize: "9px", fontWeight: 700, color: colors.text }}
            >
              {c.photo_url ? (
                <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(c.name)
              )}
            </div>

            {/* Tooltip */}
            {hoveredAvatar === link.id && (
              <div className="hidden md:block" style={{
                position: "absolute", bottom: "36px", left: "50%", transform: "translateX(-50%) translateY(-4px)",
                backgroundColor: "#1a1c1f", color: "white", borderRadius: "10px", padding: "8px 12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)", zIndex: 50, pointerEvents: "none", whiteSpace: "nowrap", minWidth: "140px",
              }}>
                <div style={{ fontWeight: 700, fontSize: "12px" }}>{c.name}</div>
                {c.job_title && <div style={{ fontSize: "10px", opacity: 0.8 }}>{c.job_title}</div>}
                {link.relevance_reason && link.relevance_reason !== "user_linked" && (
                  <>
                    <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.6, marginTop: "4px" }}>Why connected:</div>
                    <div style={{ fontSize: "10px", opacity: 0.8 }}>{link.relevance_reason}</div>
                  </>
                )}
                <div style={{ fontSize: "9px", marginTop: "4px" }}>
                  {isOverdue ? ` Overdue · ${days}d ago` : "🟢 Active"}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {extraCount > 0 && (
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px solid white", backgroundColor: "#f3f3f8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#767586", marginLeft: "-8px" }}>
          +{extraCount}
        </div>
      )}

      {/* Add button */}
      <div className="relative">
        <button
          onClick={e => { e.stopPropagation(); setShowPopover(!showPopover); }}
          style={{ width: "28px", height: "28px", borderRadius: "50%", border: "2px dashed #d0d0d0", backgroundColor: "#f3f3f8", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: links.length > 0 ? "-8px" : 0, cursor: "pointer", transition: "all 150ms" }}
          className="hover:!bg-[#e1e0ff] hover:!border-[#c0c1ff] hover:!text-[#4648d4]"
        >
          <Plus className="w-3 h-3" style={{ color: "#767586" }} />
        </button>

        {/* Popover */}
        {showPopover && (
          <div
            style={{
              position: "absolute", bottom: "36px", right: 0,
              backgroundColor: "#ffffff", borderRadius: "20px", padding: "12px",
              boxShadow: "0 8px 32px rgba(70,69,84,0.12)", border: "1px solid #f0f0f5",
              width: "220px", zIndex: 50,
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#1a1c1f", marginBottom: "8px" }}>Link a contact</div>
            <div className="flex items-center gap-2" style={{ background: "#f3f3f8", borderRadius: "12px", padding: "6px 10px", marginBottom: "8px" }}>
              <Search className="w-3 h-3" style={{ color: "#767586" }} />
              <input
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="Search contacts..."
                style={{ background: "transparent", border: "none", outline: "none", fontSize: "12px", width: "100%", color: "#1a1c1f" }}
              />
            </div>
            <div style={{ maxHeight: "160px", overflowY: "auto" }}>
              {filtered.map(c => {
                const isLinked = linkedIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => !isLinked && handleLink(c.id)}
                    className={isLinked ? "" : "hover:bg-[#f3f3f8] cursor-pointer"}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 8px", borderRadius: "10px", opacity: isLinked ? 0.5 : 1 }}
                  >
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#e1e0ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, color: "#4648d4", overflow: "hidden", flexShrink: 0 }}>
                      {c.photo_url ? <img src={c.photo_url} className="w-full h-full object-cover" /> : getInitials(c.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#1a1c1f" }} className="truncate">{c.name}</div>
                      {c.job_title && <div style={{ fontSize: "10px", color: "#767586" }} className="truncate">{c.job_title}</div>}
                    </div>
                    {isLinked && <Check className="w-3 h-3 flex-shrink-0" style={{ color: "#4648d4" }} />}
                  </div>
                );
              })}
              {filtered.length === 0 && <div style={{ fontSize: "12px", color: "#767586", padding: "8px", textAlign: "center" }}>No contacts found</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
