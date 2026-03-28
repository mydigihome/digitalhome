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

export default function ProfileHeader() {
  const { user, profile } = useAuth();
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dmsSent, setDmsSent] = useState(18);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      const url = user.user_metadata?.avatar_url;
      if (url) setAvatarUrl(url);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { count } = await supabase
        .from("contact_interactions")
        .select("id", { count: "exact", head: true })
        .eq("interaction_type", "email");
      if (count != null) setDmsSent(count);
    })();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setTaglineIndex((i) => (i + 1) % TAGLINES.length);
        setFading(false);
      }, 300);
    }, 3600000);
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

  return (
    <div className="rounded-[24px] px-6 py-4 shadow-[0_12px_40px_rgba(70,69,84,0.06)] mb-6 bg-white dark:bg-[#1e2130] dark:shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="relative cursor-pointer group flex-shrink-0" onClick={handleAvatarClick}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-28 h-28 rounded-full object-cover"
              style={{ border: "3px solid #ffffff", boxShadow: "0 4px 20px rgba(70,69,84,0.12)" }}
            />
          ) : (
            <div
              className="w-28 h-28 rounded-full bg-[#e1e0ff] text-[#4648d4] font-extrabold text-3xl flex items-center justify-center"
              style={{ border: "3px solid #ffffff", boxShadow: "0 4px 20px rgba(70,69,84,0.12)" }}
            >
              {initials}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-3 h-3 text-white" />
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Name + tagline */}
        <div className="flex-1 min-w-0">
          <h2
            className="font-extrabold text-2xl tracking-tight text-foreground"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {profile?.full_name || "Your Name"}
          </h2>
          <p
            className="text-sm text-muted-foreground italic transition-opacity duration-400"
            style={{ opacity: fading ? 0 : 1 }}
          >
            {TAGLINES[taglineIndex]}
          </p>
        </div>

        {/* Single stat */}
        <div className="text-right flex-shrink-0">
          <div className="font-extrabold text-3xl text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {dmsSent}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
            contacts emailed
          </div>
        </div>
      </div>
    </div>
  );
}
