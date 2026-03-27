import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera } from "lucide-react";

const TAGLINES = [
  "Your network is your net worth.",
  "Close mouths don't get fed.",
  "It's not what you know, it's who you know.",
  "Stop doing it alone — use your network.",
  "There is no I in team.",
  "Build genuine connections.",
  "Relationships will get you into any room you want to stand in.",
  "Invest in your community.",
  "It takes a village. You'll never get there alone.",
];

interface Stats {
  totalContacts: number;
  priority: number;
  dmsSent: number;
  avgResponse: string;
  streak: string;
}

export default function ProfileHeader() {
  const { user, profile } = useAuth();
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<Stats>({
    totalContacts: 24,
    priority: 2,
    dmsSent: 18,
    avgResponse: "2.4 days",
    streak: "12 day",
  });

  // Load avatar
  useEffect(() => {
    if (user) {
      const url = user.user_metadata?.avatar_url;
      if (url) setAvatarUrl(url);
    }
  }, [user]);

  // Fetch real stats
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [contactsRes, priorityRes, interactionsRes] = await Promise.all([
        supabase.from("contacts").select("id", { count: "exact", head: true }),
        supabase.from("priority_contacts").select("id", { count: "exact", head: true }),
        supabase.from("contact_interactions").select("id", { count: "exact", head: true }).eq("interaction_type", "email"),
      ]);
      setStats((s) => ({
        ...s,
        totalContacts: contactsRes.count ?? s.totalContacts,
        priority: priorityRes.count ?? s.priority,
        dmsSent: interactionsRes.count ?? s.dmsSent,
      }));
    })();
  }, [user]);

  // Rotate taglines
  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setTaglineIndex((i) => (i + 1) % TAGLINES.length);
        setFading(false);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const handleAvatarClick = () => fileRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const path = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      setAvatarUrl(publicUrl);
      toast.success("Profile photo updated");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const STAT_ITEMS = [
    { value: stats.totalContacts, label: "Contacts" },
    { value: stats.priority, label: "Priority" },
    { value: stats.dmsSent, label: "DMs Sent" },
    { value: stats.avgResponse, label: "Avg Response" },
    { value: stats.streak, label: "Streak" },
  ];

  return (
    <div className="bg-white rounded-[32px] shadow-[0_12px_40px_rgba(70,69,84,0.06)] overflow-hidden mb-6">
      {/* Cover */}
      <div
        className="h-20 relative"
        style={{
          background: "linear-gradient(135deg, #4648d4, #6063ee)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Profile row */}
      <div className="px-6 pb-5 relative">
        {/* Avatar */}
        <div
          className="absolute -mt-8 cursor-pointer group"
          onClick={handleAvatarClick}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-16 h-16 rounded-full border-4 border-white shadow-md object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-white shadow-md bg-[#e1e0ff] text-[#4648d4] font-extrabold text-xl flex items-center justify-center">
              {initials}
            </div>
          )}
          {/* Camera overlay */}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-3 h-3 text-white" />
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Name + tagline */}
        <div className="ml-[76px] pt-2">
          <h2
            className="font-bold text-lg text-[#1a1c1f]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {profile?.full_name || "Your Name"}
          </h2>
          <p
            className="text-xs text-[#767586] italic mt-0.5 transition-opacity duration-300"
            style={{ opacity: fading ? 0 : 1 }}
          >
            {TAGLINES[taglineIndex]}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-4 pt-4 border-t border-[#f3f3f8] items-center">
          {STAT_ITEMS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-6">
              {i > 0 && <div className="h-8 w-px bg-[#f3f3f8]" />}
              <div className="text-center">
                <div className="font-extrabold text-xl text-[#1a1c1f]">{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-[#767586]">
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
