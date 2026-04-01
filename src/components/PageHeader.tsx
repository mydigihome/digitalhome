import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Smile, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const gradientPresets = [
  { id: "purple", label: "Purple", value: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)" },
  { id: "blue", label: "Blue", value: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)" },
  { id: "green", label: "Green", value: "linear-gradient(135deg, #10B981 0%, #059669 100%)" },
  { id: "sunset", label: "Sunset", value: "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)" },
  { id: "ocean", label: "Ocean", value: "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)" },
  { id: "forest", label: "Forest", value: "linear-gradient(135deg, #059669 0%, #065F46 100%)" },
  { id: "mono", label: "Monochrome", value: "linear-gradient(135deg, #6B7280 0%, #374151 100%)" },
  { id: "pink", label: "Pink", value: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)" },
];

const emojiList = ["clipboard", "home", "calendar", "target", "briefcase", "plane", "brain", "settings", "bar-chart", "palette", "rocket", "lightbulb", "pen-line", "flame", "star", "party-popper", "dumbbell", "sparkles", "pin", "graduation-cap", "weight", "globe", "dollar-sign", "music"];

interface PageHeaderProps {
  title: string;
  onTitleChange?: (title: string) => void;
  icon?: string | null;
  iconType?: string | null;
  onIconChange?: (icon: string, type: string) => void;
  coverImage?: string | null;
  coverType?: string | null;
  onCoverChange?: (cover: string, type: string) => void;
  editable?: boolean;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  title,
  onTitleChange,
  icon,
  iconType,
  onIconChange,
  coverImage,
  coverType,
  onCoverChange,
  editable = true,
  subtitle,
  actions,
}: PageHeaderProps) {
  const { user } = useAuth();
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const hasCover = coverType && coverType !== "none" && coverImage;
  const coverStyle = hasCover
    ? coverType === "gradient"
      ? { background: coverImage! }
      : { backgroundImage: `url(${coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, hsl(var(--primary)/0.08) 0%, hsl(var(--primary)/0.02) 100%)" };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
    const path = `${user.id}/covers/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("user-assets").upload(path, file);
    if (error) { toast.error("Upload failed"); return; }
    const { data: { publicUrl } } = supabase.storage.from("user-assets").getPublicUrl(path);
    onCoverChange?.(publicUrl, "image");
    setShowCoverPicker(false);
    toast.success("Cover updated");
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== title) {
      onTitleChange?.(titleValue.trim());
    }
  };

  return (
    <div className="mb-8 relative">
      {/* Cover Image */}
      <div className="group relative h-[200px] rounded-t-xl overflow-hidden" style={coverStyle}>
        {/* Centered upload prompt when no cover */}
        {editable && !hasCover && (
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/50 transition-colors hover:text-muted-foreground/80"
          >
            <Upload className="h-8 w-8" />
            <span className="text-xs font-medium">Click to add a cover image</span>
          </button>
        )}

        {editable && (
          <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setShowCoverPicker(!showCoverPicker)}
              className="flex items-center gap-1.5 rounded-md bg-card/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-card"
            >
              <ImagePlus className="h-3.5 w-3.5" /> {hasCover ? "Change cover" : "Add cover"}
            </button>
            {hasCover && (
              <button
                onClick={() => onCoverChange?.("", "none")}
                className="flex items-center gap-1 rounded-md bg-card/90 px-2 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-card"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
      </div>

      {/* Cover Picker Dropdown - outside overflow-hidden container */}
      {showCoverPicker && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-11 top-[56px] z-50 w-72 rounded-lg border border-border bg-card p-4 shadow-xl"
        >
          <p className="mb-3 text-xs font-medium text-muted-foreground">Gradients</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {gradientPresets.map((g) => (
              <button
                key={g.id}
                onClick={() => { onCoverChange?.(g.value, "gradient"); setShowCoverPicker(false); }}
                className="h-12 rounded-md transition-transform hover:scale-105"
                style={{ background: g.value }}
                title={g.label}
              />
            ))}
          </div>
          <button
            onClick={() => coverInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border p-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            <Upload className="h-3.5 w-3.5" /> Upload image
          </button>
        </motion.div>
      )}

      {/* Icon & Title */}
      <div className="relative px-8 -mt-10">
        <div className="flex items-end gap-4">
          {/* Icon */}
          <div className="relative">
            <button
              onClick={() => editable && setShowIconPicker(!showIconPicker)}
              className={cn(
                "flex h-[78px] w-[78px] items-center justify-center rounded-xl bg-card text-4xl shadow-md border border-border transition-transform",
                editable && "hover:scale-105 cursor-pointer"
              )}
            >
              {icon || "📋"}
            </button>

            {/* Icon Picker */}
            {showIconPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute left-0 top-[84px] z-50 w-64 rounded-lg border border-border bg-card p-3 shadow-xl"
              >
                <p className="mb-2 text-xs font-medium text-muted-foreground">Choose icon</p>
                <div className="grid grid-cols-6 gap-1.5">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { onIconChange?.(emoji, "emoji"); setShowIconPicker(false); }}
                      className="flex h-9 w-9 items-center justify-center rounded-md text-xl transition-colors hover:bg-secondary"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                {icon && (
                  <button
                    onClick={() => { onIconChange?.("", "none"); setShowIconPicker(false); }}
                    className="mt-2 w-full rounded-md py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                  >
                    Remove icon
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* Title + Subtitle */}
          {(title || onTitleChange) && (
            <div className="flex-1 pb-1">
              {isEditingTitle && editable ? (
                <input
                  ref={titleRef}
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
                  autoFocus
                  className="w-full bg-transparent text-3xl font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                  placeholder="Untitled"
                />
              ) : (
                <h1
                  onClick={() => editable && onTitleChange && setIsEditingTitle(true)}
                  className={cn(
                    "text-3xl font-semibold text-foreground",
                    editable && onTitleChange && "cursor-text hover:bg-secondary/50 rounded-md px-1 -mx-1 transition-colors"
                  )}
                >
                  {title}
                </h1>
              )}
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
          )}

          {/* Actions */}
          {actions && <div className="flex items-center gap-2 pb-1">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
