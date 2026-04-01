import { useState, useMemo } from "react";
import { X, Search, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useContacts } from "@/hooks/useContacts";
import { useQueryClient } from "@tanstack/react-query";

interface LinkedInConnection {
  name: string;
  email: string | null;
  job_title: string | null;
  company: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  connections: LinkedInConnection[];
}

const MOCK_CONNECTIONS: LinkedInConnection[] = [
  { name: "Sarah Chen", email: "sarah.chen@example.com", job_title: "Product Manager", company: "Stripe", photo_url: null, linkedin_url: "https://linkedin.com/in/sarachen" },
  { name: "Marcus Williams", email: "marcus.w@example.com", job_title: "Software Engineer", company: "Google", photo_url: null, linkedin_url: "https://linkedin.com/in/marcusw" },
  { name: "Priya Patel", email: "priya@example.com", job_title: "Design Lead", company: "Figma", photo_url: null, linkedin_url: "https://linkedin.com/in/priyap" },
  { name: "Jordan Taylor", email: "jordan.t@example.com", job_title: "Founder & CEO", company: "LaunchPad", photo_url: null, linkedin_url: "https://linkedin.com/in/jordant" },
  { name: "Amira Johnson", email: "amira.j@example.com", job_title: "Marketing Director", company: "Notion", photo_url: null, linkedin_url: "https://linkedin.com/in/amiraj" },
];

export default function LinkedInSelectionPanel({ isOpen, onClose, connections: rawConnections }: Props) {
  const displayConnections = rawConnections.length > 0 ? rawConnections : MOCK_CONNECTIONS;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const { user } = useAuth();
  const { data: existingContacts } = useContacts();
  const queryClient = useQueryClient();

  const existingEmails = useMemo(() => {
    const emails = new Set<string>();
    existingContacts?.forEach(c => { if (c.email) emails.add(c.email.toLowerCase()); });
    return emails;
  }, [existingContacts]);

  const filtered = useMemo(() => {
    if (!search.trim()) return displayConnections;
    const q = search.toLowerCase();
    return displayConnections.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.job_title?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q)
    );
  }, [displayConnections, search]);

  const selectableFiltered = useMemo(() =>
    filtered.filter(c => !c.email || !existingEmails.has(c.email.toLowerCase())),
    [filtered, existingEmails]
  );

  const allSelected = selectableFiltered.length > 0 && selectableFiltered.every((_, i) => {
    const realIdx = displayConnections.indexOf(selectableFiltered[i]);
    return selected.has(realIdx);
  });

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      const next = new Set<number>();
      selectableFiltered.forEach(c => {
        next.add(displayConnections.indexOf(c));
      });
      setSelected(next);
    }
  };

  const toggle = (idx: number) => {
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setSelected(next);
  };

  const handleImport = async () => {
    if (!user || selected.size === 0) return;
    setImporting(true);
    try {
      const toImport = Array.from(selected).map(i => displayConnections[i]);
      const rows = toImport.map(c => ({
        user_id: user.id,
        name: c.name,
        email: c.email,
        job_title: c.job_title,
        company: c.company,
        photo_url: c.photo_url,
        linkedin_url: c.linkedin_url,
        relationship_type: "professional",
        imported_from: "linkedin",
      }));

      const { error } = await supabase.from("contacts").insert(rows);
      if (error) throw error;

      toast.success(`${rows.length} contacts imported from LinkedIn`);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setSelected(new Set());
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to import contacts");
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-screen w-[400px] max-w-full bg-white dark:bg-[#1e2130] border-l border-[#e5e7eb] dark:border-[#2a2d3e] z-50 flex flex-col"
        style={{ boxShadow: "-8px 0 32px rgba(0,0,0,0.08)" }}>
        {/* Header */}
        <div className="p-5 border-b border-[#f0f0f0] dark:border-[#2a2d3e]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-base text-[#111827] dark:text-[#f9fafb]">Import from LinkedIn</h2>
              <p className="text-xs text-[#9ca3af] mt-1">{displayConnections.length} connections found</p>
            </div>
            <button onClick={onClose} className="rounded-full p-1.5 hover:bg-[#f3f3f8] dark:hover:bg-[#252836]">
              <X className="w-4 h-4 text-[#9ca3af]" />
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search connections..."
              className="bg-[#f9fafb] dark:bg-[#252836] border border-[#e5e7eb] dark:border-[#2a2d3e] rounded-[8px] pl-9 pr-4 py-2.5 text-sm w-full outline-none focus:ring-1 focus:ring-[#4648d4] text-[#111827] dark:text-[#f9fafb] placeholder:text-[#9ca3af]"
            />
          </div>
        </div>

        {/* Select all */}
        <div className="px-5 py-3 border-b border-[#f0f0f0] dark:border-[#2a2d3e] flex items-center gap-3">
          <button
            onClick={toggleAll}
            className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${allSelected ? "bg-[#111827] border-[#111827] dark:bg-[#6366f1] dark:border-[#6366f1]" : "border-[#d1d5db] dark:border-[#4b5563]"}`}
          >
            {allSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </button>
          <span className="text-sm font-medium text-[#111827] dark:text-[#f9fafb]">Select all ({selectableFiltered.length})</span>
        </div>

        {/* Connections list */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          {filtered.map((c, fi) => {
            const realIdx = displayConnections.indexOf(c);
            const alreadyImported = c.email ? existingEmails.has(c.email.toLowerCase()) : false;
            const isSelected = selected.has(realIdx);

            return (
              <div
                key={`${c.name}-${fi}`}
                className={`flex items-center gap-3 py-2.5 ${alreadyImported ? "opacity-50" : "cursor-pointer hover:bg-[#f9fafb] dark:hover:bg-[#252836]"} rounded-lg px-1`}
                onClick={() => !alreadyImported && toggle(realIdx)}
              >
                <button
                  disabled={alreadyImported}
                  className={`w-[18px] h-[18px] rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    alreadyImported
                      ? "bg-[#e5e7eb] border-[#e5e7eb] dark:bg-[#374151] dark:border-[#374151]"
                      : isSelected
                      ? "bg-[#111827] border-[#111827] dark:bg-[#6366f1] dark:border-[#6366f1]"
                      : "border-[#d1d5db] dark:border-[#4b5563]"
                  }`}
                >
                  {(isSelected || alreadyImported) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </button>

                <div className="w-9 h-9 rounded-full bg-[#e1e0ff] dark:bg-[#3730a3] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#4648d4] dark:text-[#a5b4fc] font-semibold text-sm">{c.name[0]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-[#111827] dark:text-[#f9fafb] truncate">{c.name}</div>
                  <div className="text-xs text-[#9ca3af] truncate">
                    {[c.job_title, c.company].filter(Boolean).join(" · ") || "No details"}
                  </div>
                  {alreadyImported && (
                    <span className="text-[10px] text-[#16a34a]"> Already in contacts</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#f0f0f0] dark:border-[#2a2d3e] flex items-center justify-between">
          <span className="text-xs text-[#9ca3af]">{selected.size} selected</span>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-sm text-[#9ca3af] hover:text-[#6b7280]">Cancel</button>
            <button
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="bg-[#111827] dark:bg-[#6366f1] text-white rounded-[8px] px-5 py-2.5 text-sm font-semibold disabled:opacity-40 transition-opacity"
            >
              {importing ? "Importing..." : `Import Selected`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
