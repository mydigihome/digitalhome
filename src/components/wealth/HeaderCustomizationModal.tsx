import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUpsertPreferences } from "@/hooks/useUserPreferences";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const COLORS = ["#6366F1", "#EC4899", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#0EA5E9"];

interface HeaderCustomizationModalProps {
  pageKey: "money" | "applications";
  currentType: string;
  currentValue: string;
  onClose: () => void;
}

export default function HeaderCustomizationModal({ pageKey, currentType, currentValue, onClose }: HeaderCustomizationModalProps) {
  const { user } = useAuth();
  const upsertPrefs = useUpsertPreferences();
  const [headerType, setHeaderType] = useState(currentType || "color");
  const [selectedColor, setSelectedColor] = useState(currentValue || "#6366F1");
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(currentType === "photo" ? currentValue : null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    setUploading(true);
    try {
      const path = `${user.id}/${pageKey}-header-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("banners").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("banners").getPublicUrl(path);
      setUploadedPhoto(publicUrl);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const value = headerType === "photo" ? uploadedPhoto : selectedColor;
    if (!value) { toast.error("Please select a color or upload a photo"); return; }
    try {
      await upsertPrefs.mutateAsync({
        [`${pageKey}_header_type`]: headerType,
        [`${pageKey}_header_value`]: value,
      } as any);
      toast.success("Header updated!");
      onClose();
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-3xl border border-border shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Customize Header</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Type selector */}
          <div className="flex gap-3">
            <button
              onClick={() => setHeaderType("color")}
              className={`flex-1 py-3 rounded-xl border-2 font-semibold transition text-sm ${
                headerType === "color" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"
              }`}
            >
              Color
            </button>
            <button
              onClick={() => setHeaderType("photo")}
              className={`flex-1 py-3 rounded-xl border-2 font-semibold transition text-sm ${
                headerType === "photo" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"
              }`}
            >
              Photo
            </button>
          </div>

          {/* Color picker */}
          {headerType === "color" && (
            <div className="grid grid-cols-4 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`h-16 rounded-xl border-4 transition hover:scale-105 ${
                    selectedColor === color ? "border-foreground scale-110 shadow-lg" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}

          {/* Photo upload */}
          {headerType === "photo" && (
            <div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full h-40 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition flex flex-col items-center justify-center gap-2 overflow-hidden"
              >
                {uploadedPhoto ? (
                  <img src={uploadedPhoto} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Upload header image"}</p>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Preview */}
          <div className="rounded-2xl h-20 overflow-hidden" style={
            headerType === "photo" && uploadedPhoto
              ? { backgroundImage: `url(${uploadedPhoto})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: `linear-gradient(135deg, ${selectedColor}20, ${selectedColor}10)` }
          }>
            <div className="h-full flex items-center justify-center">
              <span className="text-xs text-muted-foreground font-medium">Preview</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleSave} className="flex-1">Save Header</Button>
        </div>
      </motion.div>
    </div>
  );
}
