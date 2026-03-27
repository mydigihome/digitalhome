import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (contact: {
    name: string;
    email: string;
    phone: string;
    company: string;
    title: string;
    relationship_type: string;
  }) => void;
}

export default function AddContactModal({ isOpen, onClose, onAdd }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Professional");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({ name, email, phone, company, title, relationship_type: type.toLowerCase() });
    setName(""); setEmail(""); setPhone(""); setCompany(""); setTitle(""); setType("Professional");
    onClose();
  };

  const types = ["Family", "Friends", "Professional", "Mentor"];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]" onClick={onClose}>
      <div className="bg-white rounded-[32px] p-8 max-w-[480px] w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-xl text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Add Contact
          </h2>
          <button onClick={onClose} className="rounded-full bg-[#f3f3f8] p-2">
            <X className="w-4 h-4 text-[#767586]" />
          </button>
        </div>

        <div className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name *"
            className="bg-[#f3f3f8] rounded-[16px] px-4 py-3 text-sm w-full outline-none focus:ring-2 focus:ring-[#4648d4]" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="bg-[#f3f3f8] rounded-[16px] px-4 py-3 text-sm w-full outline-none focus:ring-2 focus:ring-[#4648d4]" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone"
            className="bg-[#f3f3f8] rounded-[16px] px-4 py-3 text-sm w-full outline-none focus:ring-2 focus:ring-[#4648d4]" />
          <div className="grid grid-cols-2 gap-3">
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company"
              className="bg-[#f3f3f8] rounded-[16px] px-4 py-3 text-sm w-full outline-none focus:ring-2 focus:ring-[#4648d4]" />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Job Title"
              className="bg-[#f3f3f8] rounded-[16px] px-4 py-3 text-sm w-full outline-none focus:ring-2 focus:ring-[#4648d4]" />
          </div>
          <div className="flex gap-2">
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                  type === t ? "bg-[#4648d4] text-white" : "bg-[#f3f3f8] text-[#767586]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onClose} className="bg-[#f3f3f8] text-[#1a1c1f] rounded-full px-6 py-2.5 font-bold text-sm">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="text-white rounded-full px-6 py-2.5 font-bold text-sm disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)" }}
          >
            Add Contact
          </button>
        </div>
      </div>
    </div>
  );
}
