import { useState } from "react";
import { Plus, Trash2, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { useBrandCollaborations, useCreateBrandCollab, useDeleteBrandCollab, useUpdateBrandCollab } from "@/hooks/useBrandCollaborations";

const STATUSES = ["Reached Out", "In Discussion", "Accepted", "Declined", "Completed"];
const STATUS_COLORS: Record<string, string> = {
  "Reached Out": "#FFF3CD",
  "In Discussion": "#CCE5FF",
  "Accepted": "#D4EDDA",
  "Declined": "#FFD0D0",
  "Completed": "#E8D5FF",
};

export default function BrandCollabsSection() {
  const { data: collabs = [] } = useBrandCollaborations();
  const createCollab = useCreateBrandCollab();
  const updateCollab = useUpdateBrandCollab();
  const deleteCollab = useDeleteBrandCollab();

  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    brand_name: "",
    contact_name: "",
    contact_email: "",
    status: "Reached Out",
    deal_value: 0,
    campaign_start: null as string | null,
    campaign_end: null as string | null,
    notes: "",
  });

  const filtered = collabs.filter(c => !filterStatus || c.status === filterStatus);

  const handleSave = async () => {
    if (!form.brand_name.trim()) { toast.error("Brand name required"); return; }
    try {
      await createCollab.mutateAsync(form);
      setForm({ brand_name: "", contact_name: "", contact_email: "", status: "Reached Out", deal_value: 0, campaign_start: null, campaign_end: null, notes: "" });
      setShowForm(false);
      toast.success("Brand collaboration added!");
    } catch { toast.error("Failed to add"); }
  };

  return (
    <div className="border-t border-gray-200 mt-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Brand Collaborations</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Plus size={12} /> Track Brand Collab
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="mb-3 border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input value={form.brand_name} onChange={e => setForm(p => ({ ...p, brand_name: e.target.value }))} placeholder="Brand name *" className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none bg-white" />
            <input value={form.contact_name} onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))} placeholder="Contact person" className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none bg-white" />
            <input type="email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))} placeholder="Contact email" className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none bg-white" />
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="text-xs border border-gray-200 rounded px-2 py-1.5 bg-white">
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="number" value={form.deal_value || ""} onChange={e => setForm(p => ({ ...p, deal_value: Number(e.target.value) }))} placeholder="Deal value ($)" className="text-xs border border-gray-200 rounded px-2 py-1.5 outline-none bg-white" />
            <div className="flex gap-1">
              <input type="date" value={form.campaign_start || ""} onChange={e => setForm(p => ({ ...p, campaign_start: e.target.value || null }))} className="text-xs border border-gray-200 rounded px-1 py-1.5 outline-none bg-white flex-1" />
              <input type="date" value={form.campaign_end || ""} onChange={e => setForm(p => ({ ...p, campaign_end: e.target.value || null }))} className="text-xs border border-gray-200 rounded px-1 py-1.5 outline-none bg-white flex-1" />
            </div>
          </div>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes..." className="w-full text-xs border border-gray-200 rounded p-2 outline-none bg-white resize-none" rows={2} />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
            <button onClick={handleSave} className="text-xs bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700">Save</button>
          </div>
        </div>
      )}

      {/* Filter */}
      {collabs.length > 0 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          <button
            onClick={() => setFilterStatus(null)}
            className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${!filterStatus ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}
          >All ({collabs.length})</button>
          {STATUSES.map(s => {
            const count = collabs.filter(c => c.status === s).length;
            if (count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${filterStatus === s ? "bg-gray-800 text-white" : "text-gray-500"}`}
                style={{ background: filterStatus === s ? undefined : STATUS_COLORS[s] }}
              >{s} ({count})</button>
            );
          })}
        </div>
      )}

      {/* Cards */}
      <div className="space-y-2">
        {filtered.map(collab => (
          <div key={collab.id} className="border border-gray-200 rounded-lg p-3 bg-white group">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-gray-800">{collab.brand_name}</div>
                {collab.contact_name && <div className="text-xs text-gray-500">{collab.contact_name}</div>}
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={collab.status}
                  onChange={e => updateCollab.mutate({ id: collab.id, status: e.target.value })}
                  className="text-[10px] rounded-full px-2 py-0.5 border-none outline-none font-semibold"
                  style={{ background: STATUS_COLORS[collab.status] || "#E5E7EB" }}
                >
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                {collab.contact_email && (
                  <a href={`mailto:${collab.contact_email}`} className="text-gray-400 hover:text-gray-600">
                    <Mail size={13} />
                  </a>
                )}
                <button
                  onClick={() => { deleteCollab.mutate(collab.id); toast.success("Removed"); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
              {collab.deal_value > 0 && <span className="font-semibold text-green-600">${collab.deal_value.toLocaleString()}</span>}
              {collab.campaign_start && <span>{collab.campaign_start} → {collab.campaign_end || "TBD"}</span>}
            </div>
            {collab.notes && <p className="text-xs text-gray-500 mt-1.5">{collab.notes}</p>}
          </div>
        ))}
      </div>

      {filtered.length === 0 && !showForm && (
        <p className="text-xs text-gray-400 text-center py-3">No brand collaborations tracked yet</p>
      )}
    </div>
  );
}
